{
  pkgs,
  config,
  lib,
  ...
}: let
  wofiTheme = import ./wofi.nix {inherit pkgs;};

  wofiNetworkManager = pkgs.writeShellScriptBin "wofi-network-manager" ''
    #!/usr/bin/env bash

    WOFI_CMD="wofi --show dmenu --conf ${wofiTheme.config} --style ${wofiTheme.style}"

    function get_wifi_state() {
        if [ "$(nmcli -t -f WIFI radio)" = "enabled" ]; then echo "[ON]"; else echo "[OFF]"; fi
    }

    function get_eth_state() {
        local dev=$(nmcli -t -f DEVICE,TYPE,STATE device | awk -F':' '$2=="ethernet"{print $1; exit}')
        if [ -n "$dev" ]; then
            local state=$(nmcli -t -f DEVICE,STATE device | awk -F':' -v dev="$dev" '$1==dev{print $2}')
            if [ "$state" = "connected" ]; then echo "[ON]"; else echo "[OFF]"; fi
        else
            echo "[OFF]"
        fi
    }

    function get_bt_state() {
        if bluetoothctl show | grep -q "Powered: yes"; then echo "[ON]"; else echo "[OFF]"; fi
    }

    function main_menu() {
        local wifi_st=$(get_wifi_state)
        local eth_st=$(get_eth_state)
        local bt_st=$(get_bt_state)

        local options="  Manage WiFi\n  Manage Ethernet\n  Manage Bluetooth\n  Toggle WiFi $wifi_st\n  Toggle Ethernet $eth_st\n  Toggle Bluetooth $bt_st\n  Static IP / DHCP\n  Exit"
        local choice=$(echo -e "$options" | $WOFI_CMD --prompt "Network & Bluetooth")

        if [[ "$choice" == "  Manage WiFi" ]]; then manage_wifi
        elif [[ "$choice" == "  Manage Ethernet" ]]; then manage_ethernet
        elif [[ "$choice" == "  Manage Bluetooth" ]]; then manage_bt
        elif [[ "$choice" == "  Toggle WiFi"* ]]; then toggle_wifi
        elif [[ "$choice" == "  Toggle Ethernet"* ]]; then toggle_ethernet
        elif [[ "$choice" == "  Toggle Bluetooth"* ]]; then toggle_bt
        elif [[ "$choice" == "  Static IP / DHCP" ]]; then manage_ip
        else exit 0; fi
    }

    function manage_wifi() {
        nmcli radio wifi on
        nmcli device wifi rescan > /dev/null 2>&1

        local wifis=$(nmcli -t -f IN-USE,SSID,SECURITY,BARS device wifi list | grep -v '^\*::' | sed 's/\\://g' | awk -F':' '{
            in_use=$1; ssid=$2; sec=$3; bars=$4;
            if(ssid != "") {
                prefix="  "
                if (in_use == "*") prefix="* "
                print prefix ssid "  (" sec ")  " bars
            }
        }')

        if [ -z "$wifis" ]; then
            echo "No WiFi networks found." | $WOFI_CMD --prompt "Info"
            main_menu
            return
        fi

        local choice=$(echo -e "󰌌  Manual Entry\n$wifis" | $WOFI_CMD --prompt "Select WiFi")
        if [ -z "$choice" ]; then main_menu; return; fi

        local ssid=""
        if [ "$choice" = "󰌌  Manual Entry" ]; then
            ssid=$(echo "" | $WOFI_CMD --prompt "Enter SSID")
        else
            ssid=$(echo "$choice" | sed -E 's/^[* ] //; s/  \(.*//')
        fi
        if [ -z "$ssid" ]; then main_menu; return; fi

        local known=$(nmcli -t -f NAME connection show | grep -x "$ssid")
        if [ -n "$known" ]; then
            nmcli connection up id "$ssid"
        else
            local pass=$(echo "" | wofi --show dmenu --password --prompt "Password for $ssid" --conf ${wofiTheme.config} --style ${wofiTheme.style})
            if [ -n "$pass" ]; then
                nmcli device wifi connect "$ssid" password "$pass"
            else
                nmcli device wifi connect "$ssid"
            fi
        fi
    }

    function manage_ethernet() {
        local eth_cons=$(nmcli -t -f NAME,TYPE connection show | awk -F':' '$2=="802-3-ethernet"{print $1}')
        if [ -z "$eth_cons" ]; then
            echo "No Ethernet connections found." | $WOFI_CMD --prompt "Info"
            main_menu
            return
        fi
        local choice=$(echo -e "$eth_cons" | $WOFI_CMD --prompt "Select Ethernet Connection")
        if [ -n "$choice" ]; then
            local action=$(echo -e "Up\nDown" | $WOFI_CMD --prompt "Action for $choice")
            if [ "$action" = "Up" ]; then nmcli connection up id "$choice";
            elif [ "$action" = "Down" ]; then nmcli connection down id "$choice"; fi
        fi
        main_menu
    }

    function toggle_wifi() {
        local state=$(nmcli -t -f WIFI radio)
        if [ "$state" = "enabled" ]; then nmcli radio wifi off; else nmcli radio wifi on; fi
        main_menu
    }

    function toggle_ethernet() {
        local dev=$(nmcli -t -f DEVICE,TYPE,STATE device | awk -F':' '$2=="ethernet"{print $1; exit}')
        if [ -z "$dev" ]; then echo "No Ethernet device found." | $WOFI_CMD --prompt "Info"; main_menu; return; fi
        local state=$(nmcli -t -f DEVICE,STATE device | awk -F':' -v dev="$dev" '$1==dev{print $2}')
        if [ "$state" = "connected" ]; then nmcli device disconnect "$dev"; else nmcli device connect "$dev"; fi
        main_menu
    }

    function manage_ip() {
        local cons=$(nmcli -t -f NAME,TYPE connection show --active)
        if [ -z "$cons" ]; then echo "No active connections." | $WOFI_CMD --prompt "Info"; main_menu; return; fi
        local con=$(echo -e "$cons" | awk -F':' '{print $1}' | $WOFI_CMD --prompt "Select Connection")
        if [ -z "$con" ]; then main_menu; return; fi

        local mode=$(echo -e "DHCP\nStatic IP" | $WOFI_CMD --prompt "Configuration for $con")
        if [ "$mode" = "DHCP" ]; then
            nmcli connection modify "$con" ipv4.method auto
            nmcli connection up id "$con"
        elif [ "$mode" = "Static IP" ]; then
            local ip=$(echo "" | $WOFI_CMD --prompt "Enter IP (e.g. 192.168.1.50/24)")
            if [ -z "$ip" ]; then main_menu; return; fi
            local gw=$(echo "" | $WOFI_CMD --prompt "Enter Gateway (e.g. 192.168.1.1)")
            if [ -z "$gw" ]; then main_menu; return; fi
            local dns=$(echo "" | $WOFI_CMD --prompt "Enter DNS (e.g. 8.8.8.8)")
            if [ -z "$dns" ]; then main_menu; return; fi

            nmcli connection modify "$con" ipv4.addresses "$ip" ipv4.gateway "$gw" ipv4.dns "$dns" ipv4.method manual
            nmcli connection up id "$con"
        fi
    }

    function toggle_bt() {
        if bluetoothctl show | grep -q "Powered: yes"; then
            bluetoothctl power off
        else
            bluetoothctl power on
        fi
        main_menu
    }

    function manage_bt() {
        local devices=$(bluetoothctl devices | awk '{print $2 " " substr($0, index($0,$3))}')
        if [ -z "$devices" ]; then
            echo "No Bluetooth devices found." | $WOFI_CMD --prompt "Info"
            main_menu
            return
        fi
        local choice=$(echo -e "$devices" | $WOFI_CMD --prompt "Select BT Device")
        if [ -z "$choice" ]; then main_menu; return; fi

        local mac=$(echo "$choice" | awk '{print $1}')
        local action=$(echo -e "Connect\nDisconnect\nPair\nRemove" | $WOFI_CMD --prompt "Action for $mac")

        case "$action" in
            "Connect") bluetoothctl connect "$mac" ;;
            "Disconnect") bluetoothctl disconnect "$mac" ;;
            "Pair") bluetoothctl pair "$mac" ;;
            "Remove") bluetoothctl remove "$mac" ;;
        esac
        main_menu
    }

    main_menu
  '';
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
      "modules-right": ["custom/theme", "pulseaudio", "network", "cpu", "memory", "temperature"${lib.optionalString (config.networking.hostName == "halix-laptop") '', "group/power"''}, "clock", "tray"],
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
      "group/power": {
        "orientation": "inherit",
        "drawer": {
          "transition-duration": 500,
          "children-class": "not-power",
          "transition-left-to-right": true
        },
        "modules": [
          "battery"${lib.optionalString (config.networking.hostName == "halix-laptop") ''        ,
                  "power-profiles-daemon"''}
        ]
      },
      "battery": {
        "states": {
          "warning": 30,
          "critical": 15
        },
        "format": "{capacity}% {icon} ",
        "format-charging": "{capacity}%  ",
        "format-plugged": "{capacity}%  ",
        "format-alt": "{time} {icon} ",
        "format-icons": ["", "", "", "", ""]
      },
      "power-profiles-daemon": {
        "format": "{icon}",
        "tooltip-format": "Power profile: {profile}\nDriver: {driver}",
        "tooltip": true,
        "format-icons": {
          "default": "⚡",
          "performance": "⚡",
          "balanced": "⚖️",
          "power-saver": "🍃"
        }
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
        "format-alt": "{ifname}: {ipaddr}/{cidr}",
        "on-click": "wofi-network-manager"
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
      },
      "custom/theme": {
        "format": "",
        "on-click": "theme-manager",
        "tooltip": "Theme Manager"
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

    @keyframes blink {
      to {
        background-color: @background;
        color: @foreground;
      }
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
    #power,
    #clock,
    #custom-theme,
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
    #battery { color: @color2; padding-right: 4px; }
    #battery.charging { color: @color3; }
    #battery.warning:not(.charging) { color: @color1; }
    #battery.critical:not(.charging) { color: @color1; animation-name: blink; animation-duration: 0.5s; animation-timing-function: linear; animation-iteration-count: infinite; animation-direction: alternate; }
    #power-profiles-daemon {
      color: @color6;
      padding-left: 10px;
      padding-right: 10px;
    }
    #network { color: @color6; }
    #pulseaudio { color: @color7; }
    #custom-theme { color: @color8; }

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
    exec ${pkgs.waybar}/bin/waybar -c ${waybarConfig} -s ${waybarStyle}
  '';
in {
  environment.systemPackages = [
    pkgs.waybar
    startWaybar
    pkgs.ags
    wofiNetworkManager
  ];
}
