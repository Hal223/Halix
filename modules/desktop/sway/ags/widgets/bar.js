import App from 'resource:///com/github/Aylur/ags/app.js';
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import Utils from 'resource:///com/github/Aylur/ags/utils.js';
import Audio from 'resource:///com/github/Aylur/ags/service/audio.js';
import Network from 'resource:///com/github/Aylur/ags/service/network.js';
import Battery from 'resource:///com/github/Aylur/ags/service/battery.js';

import { swayWorkspaces, windowTitle } from '../variables/sway.js';
import { cpu, ram, temp, time } from '../variables/system.js';
import { IS_LAPTOP } from '../vars.js';

function Workspaces() {
    return Widget.Box({
        class_name: 'workspaces module',
        children: swayWorkspaces.bind().transform(ws => {
            if (!Array.isArray(ws)) return []; // Safety check
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

function WindowTitle() {
    return Widget.Box({
        class_name: 'window-title module',
        child: Widget.Label({
            label: windowTitle.bind().transform(t => t ? (t.length > 50 ? t.substring(0, 50) + "..." : t) : ""),
        }),
    });
}

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

function ThemeWidget() {
    return Widget.Button({
        class_name: 'theme module',
        on_clicked: () => Utils.execAsync(['theme-manager']).catch(print),
        child: Widget.Label(''),
    });
}

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
        const battery = BatteryWidget();
        if (battery) modules.push(battery);
    }
    modules.push(Clock());

    return Widget.Box({
        hpack: 'end',
        children: modules,
    });
}

export function Bar(monitor = 0) {
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
