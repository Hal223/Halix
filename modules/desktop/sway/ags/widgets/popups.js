import App from 'resource:///com/github/Aylur/ags/app.js';
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import Utils from 'resource:///com/github/Aylur/ags/utils.js';
import Audio from 'resource:///com/github/Aylur/ags/service/audio.js';
import Network from 'resource:///com/github/Aylur/ags/service/network.js';
import Variable from 'resource:///com/github/Aylur/ags/variable.js';

const VolumeSlider = (type = 'speaker') => Widget.Box({
    class_name: 'audio-slider-box',
    children: [
        Widget.Button({
            class_name: 'mute-btn',
            on_clicked: () => {
                if (Audio[type]) Audio[type].is_muted = !Audio[type].is_muted;
            },
            child: Widget.Label().hook(Audio, self => {
                const stream = Audio[type];
                if (!stream) return;
                if (type === 'speaker') {
                    self.label = stream.is_muted ? '' : '';
                } else {
                    self.label = stream.is_muted ? '' : '';
                }
            }, `${type}-changed`),
        }),
        Widget.Slider({
            class_name: 'audio-slider',
            hexpand: true,
            draw_value: false,
            on_change: ({ value }) => {
                if (Audio[type]) Audio[type].volume = value;
            },
            setup: self => self.hook(Audio, () => {
                self.value = Audio[type]?.volume || 0;
            }, `${type}-changed`),
        }),
        Widget.Label({
            class_name: 'audio-percent',
            setup: self => self.hook(Audio, () => {
                self.label = `${Math.round((Audio[type]?.volume || 0) * 100)}%`;
            }, `${type}-changed`),
        })
    ]
});

const DeviceDropdown = (type = 'speakers') => {
    const show = Variable(false);
    const audioProp = type === 'speakers' ? 'speaker' : 'microphone';
    const icon = type === 'speakers' ? '' : '';

    return Widget.Box({
        vertical: true,
        class_name: 'device-dropdown',
        children: [
            Widget.Button({
                class_name: 'dropdown-header',
                on_clicked: () => show.value = !show.value,
                child: Widget.Box({
                    children: [
                        Widget.Label({ class_name: 'dropdown-icon', label: icon }),
                        Widget.Label({
                            hexpand: true,
                            xalign: 0,
                            class_name: 'dropdown-active-name',
                        }).hook(Audio, self => {
                            const active = Audio[audioProp];
                            self.label = active ? (active.description || active.name).substring(0, 30) : 'None';
                        }),
                        Widget.Label({
                            class_name: 'dropdown-arrow',
                        }).hook(show, self => {
                            self.label = show.value ? '' : '';
                        }),
                    ]
                })
            }),
            Widget.Revealer({
                reveal_child: show.bind(),
                transition: 'slide_down',
                transition_duration: 200,
                child: Widget.Box({
                    vertical: true,
                    class_name: 'dropdown-list',
                    children: Audio.bind(type).transform(devices => devices.map(
                        device => Widget.Button({
                            class_name: 'dropdown-item',
                            on_clicked: () => {
                                Audio[audioProp] = device;
                                show.value = false;
                            },
                            child: Widget.Box({
                                children: [
                                    Widget.Label({
                                        label: (device.description || device.name || 'Unknown').substring(0, 40),
                                        truncate: 'end',
                                        hexpand: true,
                                        xalign: 0,
                                    }),
                                    Widget.Label({
                                        class_name: 'active-indicator',
                                        label: '',
                                        visible: Audio.bind(audioProp)
                                            .transform(active => active?.id === device.id),
                                    })
                                ]
                            })
                        })
                    ))
                })
            })
        ]
    });
};

const AppVolumeSlider = (stream) => Widget.Box({
    class_name: 'app-mixer-item',
    children: [
        Widget.Icon({
            class_name: 'app-icon',
            tooltip_text: stream.name || '',
        }).hook(stream, self => {
            self.icon = stream.icon_name || 'audio-x-generic-symbolic';
        }),
        Widget.Box({
            vertical: true,
            hexpand: true,
            children: [
                Widget.Label({
                    label: (stream.description || stream.name || 'Unknown').substring(0, 30),
                    xalign: 0,
                    truncate: 'end',
                    class_name: 'app-name',
                }),
                Widget.Slider({
                    class_name: 'audio-slider',
                    hexpand: true,
                    draw_value: false,
                    on_change: ({ value }) => stream.volume = value,
                    setup: self => self.hook(stream, () => self.value = stream.volume),
                }),
            ]
        }),
        Widget.Label({
            class_name: 'audio-percent',
            setup: self => self.hook(stream, () => {
                self.label = `${Math.round((stream.volume || 0) * 100)}%`;
            }),
        })
    ],
});

const AppMixer = () => Widget.Box({
    vertical: true,
    class_name: 'app-mixer',
    children: Audio.bind('apps').transform(apps => apps.map(AppVolumeSlider)),
});

export function AudioPopup() {
    return Widget.Window({
        name: 'audio-popup',
        anchor: ['top', 'right'],
        margins: [4, 250],
        keymode: 'on-demand',
        visible: false,
        child: Widget.Box({
            class_name: 'popup-window audio-popup-window',
            vertical: true,
            children: [
                Widget.Box({
                    class_name: 'popup-header',
                    children: [
                        Widget.Label({ class_name: 'popup-title', label: 'Audio Settings' }),
                    ]
                }),
                Widget.Box({
                    class_name: 'audio-content',
                    vertical: true,
                    children: [
                        Widget.Label({ label: 'Playback', class_name: 'audio-section-title', xalign: 0 }),
                        VolumeSlider('speaker'),
                        DeviceDropdown('speakers'),
                        
                        Widget.Label({ label: 'Recording', class_name: 'audio-section-title', xalign: 0 }),
                        VolumeSlider('microphone'),
                        DeviceDropdown('microphones'),
                        
                        Widget.Label({ label: 'Applications', class_name: 'audio-section-title', xalign: 0 }),
                        AppMixer(),
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

export function NetworkPopup() {
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
