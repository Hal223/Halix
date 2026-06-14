{pkgs, ...}: let
  waybarConfig = pkgs.writeText "waybar-config" ''
    {
      "layer": "top",
      "position": "top",
      "height": 34,
      "spacing": 4,
      "modules-left": ["sway/workspaces", "sway/mode"],
      "modules-center": ["sway/window"],
      "modules-right": ["pulseaudio", "network", "cpu", "memory", "temperature", "clock", "tray"],
      "sway/workspaces": {
        "disable-scroll": true,
        "all-outputs": true,
        "format": "{name}"
      },
      "clock": {
        "tooltip-format": "<big>{:%Y %B}</big>\n<tt><small>{calendar}</small></tt>",
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
        "format-ethernet": "{ipaddr}/{cidr} ",
        "tooltip-format": "{ifname} via {gwaddr} ",
        "format-linked": "{ifname} (No IP) ",
        "format-disconnected": "Disconnected ⚠",
        "format-alt": "{ifname}: {ipaddr}/{cidr}"
      },
      "pulseaudio": {
        "format": "{volume}% {icon} {format_source}",
        "format-bluetooth": "{volume}% {icon} {format_source}",
        "format-bluetooth-muted": " {icon} {format_source}",
        "format-muted": " {format_source}",
        "format-source": "{volume}% ",
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
      }
    }
  '';

  waybarStyle = pkgs.writeText "waybar-style.css" ''
    @import url("file:///home/hal/.cache/wal/colors-waybar.css");

    * {
      border: none;
      border-radius: 0;
      font-family: "FiraCode Nerd Font", monospace;
      font-size: 14px;
    }

    window#waybar {
      background-color: @background;
      color: @foreground;
      transition-property: background-color;
      transition-duration: .5s;
    }

    window#waybar.hidden {
      opacity: 0.2;
    }

    #workspaces button {
      padding: 0 10px;
      background-color: transparent;
      color: @foreground;
      border-bottom: 3px solid transparent;
    }

    #workspaces button:hover {
      background: rgba(0, 0, 0, 0.2);
    }

    #workspaces button.focused {
      background-color: rgba(0, 0, 0, 0.2);
      border-bottom: 3px solid @color2;
    }

    #workspaces button.urgent {
      background-color: @color1;
    }

    #mode {
      background-color: @color4;
      border-bottom: 3px solid @foreground;
    }

    #clock,
    #battery,
    #cpu,
    #memory,
    #temperature,
    #network,
    #pulseaudio,
    #tray,
    #mode {
      padding: 0 10px;
      color: @foreground;
      background-color: @background;
      border-bottom: 3px solid @color2;
      margin: 0 2px;
    }

    #window {
      color: @foreground;
    }

    .modules-left > widget:first-child > #workspaces {
      margin-left: 0;
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
