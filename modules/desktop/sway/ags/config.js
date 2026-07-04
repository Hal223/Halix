import App from 'resource:///com/github/Aylur/ags/app.js';
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import Variable from 'resource:///com/github/Aylur/ags/variable.js';
import Utils from 'resource:///com/github/Aylur/ags/utils.js';
import Audio from 'resource:///com/github/Aylur/ags/service/audio.js';
import Network from 'resource:///com/github/Aylur/ags/service/network.js';
import Battery from 'resource:///com/github/Aylur/ags/service/battery.js';

import { JQ_PATH, IS_LAPTOP } from './vars.js';

// Sway Workspaces
const swayWorkspaces = Variable(JSON.parse(Utils.exec('swaymsg -t get_workspaces')), {
    listen: [['swaymsg', '-t', 'subscribe', '["workspace"]'], out => {
        return JSON.parse(Utils.exec('swaymsg -t get_workspaces'));
    }],
});

function Workspaces() {
    return Widget.Box({
        class_name: 'workspaces module',
        children: swayWorkspaces.bind().transform(ws => {
            return Array.from({ length: 10 }, (_, i) => i + 1).map(i => {
                const w = ws.find(workspace => workspace.num === i);
                let className = 'workspace';
                if (w) {
                    if (w.focused) className += ' focused';
                    else if (w.urgent) className += ' urgent';
                    else className += ' occupied';
                }
                return Widget.Button({
                    class_name: className,
                    on_clicked: () => Utils.execAsync(['swaymsg', 'workspace', `${i}`]).catch(print),
                    child: Widget.Label(`${i}`),
                });
            });
        }),
    });
}

// Window Title
const windowTitle = Variable(Utils.exec(`sh -c "swaymsg -t get_tree | ${JQ_PATH} -r '.. | select(.type?) | select(.focused==true).name'"`), {
    listen: [['swaymsg', '-t', 'subscribe', '["window"]'], out => {
        try {
            const data = JSON.parse(out);
            if (data.change === "focus" || data.change === "title") {
                return data.container.name;
            }
        } catch(e) {}
        return Utils.exec(`sh -c "swaymsg -t get_tree | ${JQ_PATH} -r '.. | select(.type?) | select(.focused==true).name'"`);
    }]
});

function WindowTitle() {
    return Widget.Box({
        class_name: 'window-title module',
        child: Widget.Label({
            label: windowTitle.bind().transform(t => t ? (t.length > 50 ? t.substring(0, 50) + "..." : t) : ""),
        }),
    });
}

// System Resources
const cpu = Variable(0, {
    poll: [2000, 'sh -c "vmstat 1 2 | tail -n 1"', out => {
        const parts = out.trim().split(/\s+/);
        if (parts.length >= 15) {
            const idle = parseInt(parts[14]);
            return 100 - idle;
        }
        return 0;
    }],
});

const ram = Variable(0, {
    poll: [2000, 'free -m', out => {
        const lines = out.split('\n');
        if (lines.length > 1) {
            const parts = lines[1].split(/\s+/);
            const total = parseInt(parts[1]);
            const used = parseInt(parts[2]);
            return Math.round((used / total) * 100);
        }
        return 0;
    }],
});

const temp = Variable(0, {
    poll: [2000, 'cat /sys/class/thermal/thermal_zone0/temp', out => {
        return Math.round(parseInt(out) / 1000);
    }],
});

function SysStats() {
    return Widget.Box({
        class_name: 'sysstats',
        children: [
            Widget.Box({ class_name: 'cpu module', child: Widget.Label({ label: cpu.bind().transform(v => `${v}% `) }) }),
            Widget.Box({ class_name: 'memory module', child: Widget.Label({ label: ram.bind().transform(v => `${v}% `) }) }),
            Widget.Box({ class_name: 'temp module', child: Widget.Label({ label: temp.bind().transform(v => `${v}°C `) }) }),
        ]
    });
}

// Network
function NetworkWidget() {
    return Widget.Button({
        class_name: 'network module',
        on_clicked: () => App.toggleWindow('network-popup'),
        child: Widget.Label().hook(Network, self => {
            if (Network.primary === 'wifi' && Network.wifi) {
                self.label = `${Network.wifi.ssid} `;
            } else if (Network.primary === 'wired' && Network.wired) {
                self.label = '';
            } else {
                self.label = '⚠';
            }
        }),
    });
}

// Audio
function AudioWidget() {
    return Widget.Button({
        class_name: 'audio module',
        on_clicked: () => App.toggleWindow('audio-popup'),
        child: Widget.Box({
            spacing: 8,
            children: [
                Widget.Label().hook(Audio, self => {
                    if (!Audio.speaker) return;
                    const vol = Audio.speaker.volume * 100;
                    let icon = '';
                    if (Audio.speaker.stream?.is_muted) icon = '';
                    else if (vol < 34) icon = '';
                    else if (vol < 67) icon = '';
                    self.label = icon;
                }, 'speaker-changed'),
                Widget.Label().hook(Audio, self => {
                    if (!Audio.speaker) return;
                    self.label = `${Math.round(Audio.speaker.volume * 100)}%`;
                }, 'speaker-changed'),
            ],
        }),
    });
}

// Theme
function ThemeWidget() {
    return Widget.Button({
        class_name: 'theme module',
        on_clicked: () => Utils.execAsync(['theme-manager']).catch(print),
        child: Widget.Label(''),
    });
}

// Power/Battery
function BatteryWidget() {
    if (!IS_LAPTOP) return null;
    return Widget.Box({
        class_name: 'battery module',
        setup: self => self.hook(Battery, () => {
            if (Battery.charging) {
                self.class_name = 'battery module charging';
            } else if (Battery.percent < 15) {
                self.class_name = 'battery module critical';
            } else if (Battery.percent < 30) {
                self.class_name = 'battery module warning';
            } else {
                self.class_name = 'battery module';
            }
        }),
        child: Widget.Label({
            label: Battery.bind('percent').transform(p => `${p}% ${Battery.charging ? '' : ''} `),
        }),
    });
}

// Clock
const time = Variable("", {
    poll: [1000, 'date "+%I:%M %p"'],
});
function Clock() {
    return Widget.Box({
        class_name: 'clock module',
        child: Widget.Label({ label: time.bind() }),
    });
}

function Left() {
    return Widget.Box({
        children: [Workspaces()],
    });
}

function Center() {
    return Widget.Box({
        children: [WindowTitle()],
    });
}

function Right() {
    const modules = [
        ThemeWidget(),
        AudioWidget(),
        NetworkWidget(),
        SysStats(),
    ];
    
    if (IS_LAPTOP) {
        modules.push(BatteryWidget());
    }
    modules.push(Clock());

    return Widget.Box({
        hpack: 'end',
        children: modules,
    });
}

function Bar(monitor = 0) {
    return Widget.Window({
        name: `bar-${monitor}`,
        monitor,
        anchor: ['top', 'left', 'right'],
        exclusivity: 'exclusive',
        child: Widget.CenterBox({
            start_widget: Left(),
            center_widget: Center(),
            end_widget: Right(),
        }),
    });
}

function AudioPopup() {
    return Widget.Window({
        name: 'audio-popup',
        anchor: ['top', 'right'],
        margins: [10, 10],
        keymode: 'on-demand',
        visible: false,
        child: Widget.Box({
            class_name: 'popup-window',
            vertical: true,
            children: [
                Widget.Box({
                    class_name: 'popup-header',
                    children: [
                        Widget.Label({ class_name: 'popup-title', label: 'Audio Settings' }),
                    ]
                }),
                Widget.Box({
                    class_name: 'audio-slider-box',
                    children: [
                        Widget.Button({
                            class_name: 'mute-btn',
                            on_clicked: () => Audio.speaker.is_muted = !Audio.speaker.is_muted,
                            child: Widget.Label().hook(Audio, self => {
                                self.label = Audio.speaker?.stream?.is_muted ? '' : '';
                            }, 'speaker-changed'),
                        }),
                        Widget.Slider({
                            class_name: 'audio-slider',
                            hexpand: true,
                            draw_value: false,
                            on_change: ({ value }) => Audio.speaker.volume = value,
                            setup: self => self.hook(Audio, () => {
                                self.value = Audio.speaker?.volume || 0;
                            }, 'speaker-changed'),
                        }),
                        Widget.Label({
                            class_name: 'audio-percent',
                            setup: self => self.hook(Audio, () => {
                                self.label = `${Math.round((Audio.speaker?.volume || 0) * 100)}%`;
                            }, 'speaker-changed'),
                        })
                    ]
                }),
                Widget.Button({
                    class_name: 'popup-btn',
                    on_clicked: () => {
                        App.closeWindow('audio-popup');
                        Utils.execAsync(['pwvucontrol']).catch(print);
                    },
                    child: Widget.Label('Advanced Settings'),
                })
            ],
        }),
    });
}

function NetworkPopup() {
    return Widget.Window({
        name: 'network-popup',
        anchor: ['top', 'right'],
        margins: [10, 10],
        keymode: 'on-demand',
        visible: false,
        child: Widget.Box({
            class_name: 'popup-window',
            vertical: true,
            children: [
                Widget.Box({
                    class_name: 'popup-header',
                    children: [
                        Widget.Label({ class_name: 'popup-title', label: 'Network Settings' }),
                    ]
                }),
                Widget.Box({
                    class_name: 'network-status-box',
                    children: [
                        Widget.Label().hook(Network, self => {
                            let icon = '⚠';
                            let text = 'Disconnected';
                            if (Network.primary === 'wifi' && Network.wifi) {
                                icon = '';
                                text = Network.wifi.ssid || 'Connected';
                            } else if (Network.primary === 'wired' && Network.wired) {
                                icon = '';
                                text = 'Wired Connection';
                            }
                            self.label = `${icon}   ${text}`;
                        }),
                    ]
                }),
                Widget.Button({
                    class_name: 'popup-btn',
                    on_clicked: () => {
                        App.closeWindow('network-popup');
                        Utils.execAsync(['wofi-network-manager']).catch(print);
                    },
                    child: Widget.Label('Network Manager'),
                })
            ]
        }),
    });
}

const scss = App.configDir + '/style.scss';
const css = '/tmp/ags-style.css';

// Compile scss to css synchronously using dart-sass
try {
    Utils.exec(`sass ${scss} ${css}`);
} catch (error) {
    print(`Failed to compile SCSS: ${error}`);
}

export default {
    style: css,
    windows: [
        Bar(0),
        Bar(1),
        AudioPopup(),
        NetworkPopup(),
    ],
};
