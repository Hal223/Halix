{
  pkgs,
  config,
  lib,
  ...
}: let
  agsConfigDir = pkgs.runCommand "ags-config" {} ''
        mkdir -p $out

        # Create config.js
        cat > $out/config.js <<'EOF'
    import App from 'resource:///com/github/Aylur/ags/app.js';
    import Widget from 'resource:///com/github/Aylur/ags/widget.js';
    import Variable from 'resource:///com/github/Aylur/ags/variable.js';

    const time = Variable("", {
        poll: [1000, 'date "+%I:%M %p"'],
    });

    const clock = Widget.Label({
        class_name: 'clock',
        label: time.bind(),
    });

    function Left() {
        return Widget.Box({
            class_name: 'module',
            children: [
                Widget.Label({ label: 'AGS ' }),
            ],
        });
    }

    function Center() {
        return Widget.Box({
            class_name: 'center',
            children: [
                clock,
            ],
        });
    }

    function Right() {
        return Widget.Box({
            class_name: 'module right',
            hpack: 'end',
            children: [
                Widget.Label({ label: 'Basic Setup' }),
            ],
        });
    }

    function Bar(monitor = 0) {
        return Widget.Window({
            name: `bar-''${monitor}`,
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

    export default {
        style: App.configDir + '/style.css',
        windows: [
            Bar(0),
            Bar(1), // DP-2 if connected
        ],
    };
    EOF

        # Create style.css
        cat > $out/style.css <<'EOF'
    @import url("file:///home/hal/.cache/wal/colors-waybar.css");

    * {
        font-family: "FiraCode Nerd Font", sans-serif;
        font-size: 14px;
    }

    window {
        background-color: transparent;
    }

    .module {
        background-color: alpha(@background, 0.85);
        color: @foreground;
        border-radius: 12px;
        padding: 2px 14px;
        margin: 6px 10px 0 10px;
        box-shadow: rgba(0, 0, 0, 0.2) 0px 2px 4px;
    }

    .right {
        color: @color5;
    }

    .clock {
        background-color: alpha(@background, 0.85);
        color: @color2;
        font-weight: bold;
        border-radius: 12px;
        padding: 2px 14px;
        margin: 6px 4px 0 4px;
        box-shadow: rgba(0, 0, 0, 0.2) 0px 2px 4px;
    }
    EOF
  '';

  startAgs = pkgs.writeShellScriptBin "start-ags" ''
    #!/bin/sh
    # Ensure pywal has generated colors before starting AGS
    if [ ! -f ~/.cache/wal/colors-waybar.css ]; then
      mkdir -p ~/.cache/wal
      # Create empty fallback so AGS doesn't crash if wal hasn't run yet
      touch ~/.cache/wal/colors-waybar.css
    fi

    # Start AGS with our custom config directory
    ${pkgs.ags}/bin/ags -c ${agsConfigDir}/config.js
  '';
in {
  environment.systemPackages = [
    pkgs.ags
    startAgs
  ];
}
