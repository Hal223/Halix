{pkgs, ...}: let
  waybarConfig = pkgs.writeText "waybar-config" ''
    {
      "layer": "top",
      "position": "top",
      "height": 36,
      "spacing": 4,
      "margin-top": 6,
      "margin-left": 10,
      "margin-right": 10,
      "modules-left": ["sway/workspaces", "sway/mode"],
      "modules-center": ["sway/window"],
      "modules-right": ["pulseaudio", "network", "cpu", "memory", "temperature", "clock", "tray"],
      "sway/workspaces": {
        "disable-scroll": true,
        "all-outputs": true,
        "format": "{name}",
        "tooltip": false
      },
      "sway/window": {
        "max-length": 50,
        "tooltip": false
      },
      "clock": {
        "tooltip-format": "<big>{:%Y %B}</big>\n<tt><small>{calendar}</small></tt>",
        "format": "{:%I:%M %p}",
        "format-alt": "{:%Y-%m-%d}"
      },
      "cpu": {
        "format": "{usage}% ",
        "tooltip": false
      },
      "memory": {
        "format": "{}% "
      },
      "temperature": {
        "critical-threshold": 80,
        "format": "{temperatureC}°C {icon}",
        "format-icons": ["", "", ""]
      },
      "network": {
        "format-wifi": "{essid} ({signalStrength}%) ",
        "format-ethernet": "",
        "tooltip-format": "{ifname} via {gwaddr}",
        "format-linked": "",
        "format-disconnected": "⚠",
        "format-alt": "{ifname}: {ipaddr}/{cidr}"
      },
      "pulseaudio": {
        "format": "{volume}% {icon} {format_source}",
        "format-bluetooth": "{volume}% {icon} {format_source}",
        "format-bluetooth-muted": " {icon} {format_source}",
        "format-muted": " {format_source}",
        "format-source": "",
        "format-source-muted": "",
        "format-icons": {
          "headphone": "",
          "hands-free": "",
          "headset": "",
          "phone": "",
          "portable": "",
          "car": "",
          "default": ["", "", ""]
        },
        "on-click": "pwvucontrol"
      },
      "tray": {
        "spacing": 8
      }
    }
  '';

  waybarStyle = pkgs.writeText "waybar-style.css" ''
    @import url("file:///home/hal/.cache/wal/colors-waybar.css");

    * {
      border: none;
      border-radius: 0;
      font-family: "FiraCode Nerd Font", sans-serif;
      font-size: 14px;
      min-height: 0;
    }

    window#waybar {
      background-color: transparent;
      color: @foreground;
    }

    window#waybar.hidden {
      opacity: 0.2;
    }

    /* Module background pills */
    #workspaces,
    #mode,
    #window,
    #pulseaudio,
    #network,
    #cpu,
    #memory,
    #temperature,
    #clock,
    #tray {
      background-color: alpha(@background, 0.85);
      color: @foreground;
      border-radius: 12px;
      padding: 2px 14px;
      margin: 0 4px;
      box-shadow: rgba(0, 0, 0, 0.2) 0px 2px 4px;
    }

    #workspaces {
      padding: 2px 6px;
    }

    #workspaces button {
      padding: 0 8px;
      background-color: transparent;
      color: @foreground;
      border-radius: 8px;
      margin: 4px 2px;
      transition: all 0.3s ease;
    }

    #workspaces button:hover {
      background-color: alpha(@color2, 0.4);
      box-shadow: none;
      text-shadow: none;
    }

    #workspaces button.focused {
      background-color: @color2;
      color: @background;
    }

    #workspaces button.urgent {
      background-color: @color1;
      color: @foreground;
    }

    #mode {
      background-color: @color4;
      color: @background;
      font-weight: bold;
    }

    #window {
      font-weight: bold;
      color: @color5;
    }

    /* Distinctive colors for system modules utilizing Pywal scheme */
    #cpu { color: @color3; }
    #memory { color: @color4; }
    #temperature { color: @color5; }
    #network { color: @color6; }
    #pulseaudio { color: @color7; }

    #clock {
      color: @color2;
      font-weight: bold;
    }

    #tray {
      background-color: alpha(@background, 0.85);
    }
  '';

  startWaybar = pkgs.writeShellScriptBin "start-waybar" ''
    #!/bin/sh
    # Ensure pywal has generated colors before starting Waybar
    if [ ! -f ~/.cache/wal/colors-waybar.css ]; then
      mkdir -p ~/.cache/wal
      # Create empty fallback so waybar doesn't crash if wal hasn't run yet
      touch ~/.cache/wal/colors-waybar.css
    fi

    # Start waybar
    ${pkgs.waybar}/bin/waybar -c ${waybarConfig} -s ${waybarStyle}
  '';
in {
  environment.systemPackages = [
    pkgs.waybar
    startWaybar
  ];
}
