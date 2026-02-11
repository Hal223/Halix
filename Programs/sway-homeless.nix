{pkgs, ...}: let
  # 1. DEFINE THE CONFIGURATION
  # We use 'writeText' to create the config file in the Nix Store.
  # This replaces your ~/.config/sway/config
  swayConfig = pkgs.writeText "sway-config" ''
    # --- Integration Commands ---
    # We still need to import environment variables for Wayland/Systemd
    exec systemctl --user import-environment WAYLAND_DISPLAY XDG_CURRENT_DESKTOP
    exec dbus-update-activation-environment --systemd WAYLAND_DISPLAY XDG_CURRENT_DESKTOP=sway

    # --- Pywal & Theming ---
    # Note: "Homeless" configs are read-only.
    # We can still include mutable files from home if they exist,
    # but the config itself lives in the store.
    include ~/.cache/wal/colors-sway

    # Wallpaper handling
    # We use 'sh' to execute the find command.
    # Ensure standard tools are available in the path or use absolute paths.
    exec_always swaymsg "output * bg $(find ~/Pictures/Wallpapers/ -type f | shuf -n1) fit"

    # --- Variables ---
    set $mod Mod4
    set $left h
    set $down j
    set $up k
    set $right l

    # CHANGED: You had 'foot' configured but only 'ghostty'/'kitty' in your packages.
    # I have set this to 'ghostty' to match your programs.nix.
    set $term ghostty

    set $menu wofi --show drun

    # --- Output Configuration ---
    # Default fallback
    output * bg /run/current-system/sw/share/backgrounds/sway/Sway_Wallpaper_Blue_1920x1080.png fill

    # Monitor Configuration (From your config)
    output DP-1 res 2560x1440 pos 0 0
    output DP-2 res 2560x1440 pos 2560 0

    # --- Key Bindings ---
    # Basics
    bindsym $mod+Return exec $term
    bindsym $mod+q kill
    bindsym $mod+d exec $menu

    # Drag floating windows
    floating_modifier $mod normal

    bindsym $mod+Shift+c reload

    # Exit mode
    bindsym $mod+Shift+e exec swaynag -t warning -m 'You pressed the exit shortcut.' -B 'Yes, exit sway' 'swaymsg exit'

    # Moving around (Vim keys)
    bindsym $mod+$left focus left
    bindsym $mod+$down focus down
    bindsym $mod+$up focus up
    bindsym $mod+$right focus right

    # Moving around (Arrow keys)
    bindsym $mod+Left focus left
    bindsym $mod+Down focus down
    bindsym $mod+Up focus up
    bindsym $mod+Right focus right

    # Moving windows (Vim keys)
    bindsym $mod+Shift+$left move left
    bindsym $mod+Shift+$down move down
    bindsym $mod+Shift+$up move up
    bindsym $mod+Shift+$right move right

    # Moving windows (Arrow keys)
    bindsym $mod+Shift+Left move left
    bindsym $mod+Shift+Down move down
    bindsym $mod+Shift+Up move up
    bindsym $mod+Shift+Right move right

    # --- Workspaces ---
    workspace 1 output DP-1
    workspace 2 output DP-1
    workspace 3 output DP-1
    workspace 4 output DP-1
    workspace 5 output DP-1
    workspace 6 output DP-2
    workspace 7 output DP-2
    workspace 8 output DP-2
    workspace 9 output DP-2
    workspace 10 output DP-2

    # Switch to workspace
    bindsym $mod+1 workspace number 1
    bindsym $mod+2 workspace number 2
    bindsym $mod+3 workspace number 3
    bindsym $mod+4 workspace number 4
    bindsym $mod+5 workspace number 5
    bindsym $mod+6 workspace number 6
    bindsym $mod+7 workspace number 7
    bindsym $mod+8 workspace number 8
    bindsym $mod+9 workspace number 9
    bindsym $mod+0 workspace number 10

    # Move to workspace
    bindsym $mod+Shift+1 move container to workspace number 1; workspace number 1
    bindsym $mod+Shift+2 move container to workspace number 2; workspace number 2
    bindsym $mod+Shift+3 move container to workspace number 3; workspace number 3
    bindsym $mod+Shift+4 move container to workspace number 4; workspace number 4
    bindsym $mod+Shift+5 move container to workspace number 5; workspace number 5
    bindsym $mod+Shift+6 move container to workspace number 6; workspace number 6
    bindsym $mod+Shift+7 move container to workspace number 7; workspace number 7
    bindsym $mod+Shift+8 move container to workspace number 8; workspace number 8
    bindsym $mod+Shift+9 move container to workspace number 9; workspace number 9
    bindsym $mod+Shift+0 move container to workspace number 10; workspace number 10

    # Layout stuff
    bindsym $mod+b splith
    bindsym $mod+v splitv
    bindsym $mod+s layout stacking
    bindsym $mod+w layout tabbed
    bindsym $mod+e layout toggle split
    bindsym $mod+f fullscreen
    bindsym $mod+Shift+space floating toggle
    bindsym $mod+space focus mode_toggle
    bindsym $mod+a focus parent

    # Scratchpad
    bindsym $mod+Shift+minus move scratchpad
    bindsym $mod+minus scratchpad show

    # Resizing
    bindsym $mod+Mod1+Left  resize shrink width 10px
    bindsym $mod+Mod1+Down  resize grow height 10px
    bindsym $mod+Mod1+Up    resize shrink height 10px
    bindsym $mod+Mod1+Right resize grow width 10px
    bindsym $mod+Mod1+$left  resize shrink width 10px
    bindsym $mod+Mod1+$down  resize grow height 10px
    bindsym $mod+Mod1+$up    resize shrink height 10px
    bindsym $mod+Mod1+$right resize grow width 10px

    # Utilities
    bindsym --locked XF86AudioMute exec pactl set-sink-mute @DEFAULT_SINK@ toggle
    bindsym --locked XF86AudioLowerVolume exec pactl set-sink-volume @DEFAULT_SINK@ -5%
    bindsym --locked XF86AudioRaiseVolume exec pactl set-sink-volume @DEFAULT_SINK@ +5%
    bindsym --locked XF86AudioMicMute exec pactl set-source-mute @DEFAULT_SOURCE@ toggle
    bindsym --locked XF86MonBrightnessDown exec brightnessctl set 5%-
    bindsym --locked XF86MonBrightnessUp exec brightnessctl set 5%+

    # Screenshots
    bindsym Print exec grim - | wl-copy
    bindsym $mod+Shift+s exec grim -g "$(slurp)" - | wl-copy

    # Status Bar
    bar {
        position top
        status_command while date +'%Y-%m-%d %X'; do sleep 1; done
        colors {
            statusline #ffffff
            background #323232
            inactive_workspace #32323200 #32323200 #5c5c5c
        }
    }

    include /etc/sway/config.d/*
  '';
  # 2. CREATE THE WRAPPED PACKAGE
  # This creates a script named 'sway-homeless' (or just 'sway' if you prefer)
  # that automatically passes the config file above.
in
  pkgs.writeShellScriptBin "sway-homeless" ''
    # We exec the real sway binary, passing our store-path config
    exec ${pkgs.sway}/bin/sway -c ${swayConfig} "$@"
  ''
