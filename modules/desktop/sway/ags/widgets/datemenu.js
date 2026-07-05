import App from 'resource:///com/github/Aylur/ags/app.js';
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import Notifications from 'resource:///com/github/Aylur/ags/service/notifications.js';

const Calendar = () => Widget.Calendar({
    showDayNames: true,
    showDetails: true,
    showHeading: true,
    showWeekNumbers: false,
    class_name: 'calendar',
});

const NotificationIcon = ({ app_entry, app_icon, image }) => {
    if (image) {
        return Widget.Box({
            css: `background-image: url("${image}");` +
                 'background-size: contain;' +
                 'background-repeat: no-repeat;' +
                 'background-position: center;',
            class_name: 'notification-icon',
        });
    }

    let icon = 'dialog-information-symbolic';
    if (app_icon) icon = app_icon;
    else if (app_entry) icon = app_entry;

    return Widget.Icon({
        icon,
        class_name: 'notification-icon',
    });
};

const Notification = (n) => {
    return Widget.Box({
        class_name: 'notification',
        vertical: true,
        children: [
            Widget.Box({
                children: [
                    NotificationIcon(n),
                    Widget.Box({
                        vertical: true,
                        hexpand: true,
                        children: [
                            Widget.Box({
                                children: [
                                    Widget.Label({
                                        class_name: 'notification-summary',
                                        label: n.summary,
                                        justification: 'left',
                                        maxWidthChars: 24,
                                        truncate: 'end',
                                        wrap: true,
                                        useMarkup: true,
                                        xalign: 0,
                                        hexpand: true,
                                    }),
                                    Widget.Button({
                                        class_name: 'notification-close',
                                        child: Widget.Icon('window-close-symbolic'),
                                        on_clicked: () => n.close(),
                                    }),
                                ]
                            }),
                            Widget.Label({
                                class_name: 'notification-body',
                                label: n.body,
                                justification: 'left',
                                maxWidthChars: 24,
                                wrap: true,
                                useMarkup: true,
                                xalign: 0,
                            }),
                        ]
                    })
                ]
            }),
            Widget.Box({
                class_name: 'notification-actions',
                children: n.actions.map(({ id, label }) => Widget.Button({
                    class_name: 'notification-action-button',
                    on_clicked: () => n.invoke(id),
                    hexpand: true,
                    child: Widget.Label(label),
                })),
            })
        ]
    });
};

const NotificationList = () => Widget.Scrollable({
    hscroll: 'never',
    vscroll: 'automatic',
    class_name: 'notification-scrollable',
    child: Widget.Box({
        vertical: true,
        class_name: 'notification-list',
        children: Notifications.bind('notifications').transform(
            notifs => notifs.map(Notification).reverse()
        ),
    }),
});

const ClearButton = () => Widget.Button({
    class_name: 'clear-notifications-btn',
    on_clicked: () => Notifications.clear(),
    child: Widget.Box({
        hpack: 'center',
        spacing: 4,
        children: [
            Widget.Icon('user-trash-symbolic'),
            Widget.Label('Clear All'),
        ]
    }),
    visible: Notifications.bind('notifications').transform(n => n.length > 0),
});

const DateMenuContent = () => Widget.Box({
    class_name: 'popup-window datemenu-window',
    vertical: true,
    children: [
        Calendar(),
        Widget.Box({ class_name: 'separator' }),
        Widget.Box({
            class_name: 'notification-header',
            children: [
                Widget.Label({ 
                    class_name: 'notification-title', 
                    label: 'Notifications',
                    hexpand: true,
                    xalign: 0,
                }),
                ClearButton(),
            ]
        }),
        NotificationList(),
    ],
});

export function DateMenu() {
    return Widget.Window({
        name: 'datemenu',
        anchor: ['top', 'right', 'bottom'],
        margins: [4, 4, 4, 0],
        keymode: 'on-demand',
        visible: false,
        child: Widget.Revealer({
            transition: 'slide_left',
            transition_duration: 300,
            child: DateMenuContent(),
            setup: self => self.hook(App, (self, windowName, visible) => {
                if (windowName === 'datemenu') {
                    self.reveal_child = visible;
                }
            }, 'window-toggled'),
        })
    });
}
