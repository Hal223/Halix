{
  pkgs,
  inputs,
  ...
}: let
  # Access the wrappers library from your flake inputs
  wlib = inputs.wrappers.lib;
  wofiTheme = import ./wofi.nix {inherit pkgs;};
  # 1. Define a script to randomly select wallpaper, generate pywal colors, and smoothly transition
  wallpaperTransition = pkgs.writeShellScript "wallpaper-transition" ''
    #!/bin/sh

    # Use flock to serialize executions and instantly reject overlapping runs
    LOCKFILE="/tmp/wallpaper-transition.lock"
    exec 9> "$LOCKFILE"
    if ! ${pkgs.util-linux}/bin/flock -n 9; then
      exit 0
    fi

    CURRENT_WP_FILE="/tmp/current_wallpaper"
    CURRENT_WP=""
    if [ -f "$CURRENT_WP_FILE" ]; then
      CURRENT_WP=$(${pkgs.coreutils}/bin/cat "$CURRENT_WP_FILE")
    fi

    WP=""
    WP_DIR=""
    # Process arguments
    if [ -n "$1" ]; then
      if [ -f "$1" ]; then
        WP="$1"
      elif [ -d "$1" ]; then
        WP_DIR="$1"
        if [ -n "$CURRENT_WP" ]; then
          WP=$(${pkgs.findutils}/bin/find "$WP_DIR" -type f ! -path "$CURRENT_WP" | ${pkgs.coreutils}/bin/shuf -n1)
        else
          WP=$(${pkgs.findutils}/bin/find "$WP_DIR" -type f | ${pkgs.coreutils}/bin/shuf -n1)
        fi
      fi
    else
      WP_DIR="$HOME/Pictures/Wallpapers/"
      if [ -d "$WP_DIR" ]; then
        if [ -n "$CURRENT_WP" ]; then
          WP=$(${pkgs.findutils}/bin/find "$WP_DIR" -type f ! -path "$CURRENT_WP" | ${pkgs.coreutils}/bin/shuf -n1)
        else
          WP=$(${pkgs.findutils}/bin/find "$WP_DIR" -type f | ${pkgs.coreutils}/bin/shuf -n1)
        fi
      fi
    fi

    # Fallback in case only one wallpaper exists or random selection failed
    if [ -z "$WP" ] && [ -d "$WP_DIR" ]; then
      WP=$(${pkgs.findutils}/bin/find "$WP_DIR" -type f | ${pkgs.coreutils}/bin/shuf -n1)
    fi

    if [ -n "$WP" ]; then
      echo "$WP" > "$CURRENT_WP_FILE"

      # Generate pywal colors
      ${pkgs.pywal16}/bin/wal -i "$WP" -n -q

      # Smoothly transition wallpaper using awww (formerly swww)
      # Check if awww-daemon is running, if not start it
      if ! ${pkgs.procps}/bin/pgrep -f "awww-daemon" > /dev/null; then
        ${pkgs.swww}/bin/awww-daemon 9>&- &
        ${pkgs.coreutils}/bin/sleep 2
      fi

      # Try to set wallpaper, retry if it fails (daemon might still be starting)
      for i in 1 2 3 4 5; do
        if ${pkgs.swww}/bin/awww img "$WP" --transition-type wave --transition-angle 30 --transition-step 120 --transition-duration 0.8 --transition-fps 60 --filter Bilinear; then
          break
        fi
        ${pkgs.coreutils}/bin/sleep 1
      done

      # Kill swaybg to ensure it doesn't cover awww
      ${pkgs.psmisc}/bin/killall swaybg || true
    fi

    # Restart AGS completely instead of just reloading CSS
    ${pkgs.psmisc}/bin/killall .ags-wrapped start-ags ags || true

    # Release the lock before starting long-running background processes
    exec 9>&-

    # Start AGS in the background
    PATH="/run/wrappers/bin:/run/current-system/sw/bin:$PATH" start-ags &

    # Generate sway variables from pywal colors and apply them
    if [ -f ~/.cache/wal/colors.sh ]; then
      . ~/.cache/wal/colors.sh
      echo "set \$color0 $color0" > ~/.cache/wal/colors-sway
      echo "set \$color1 $color1" >> ~/.cache/wal/colors-sway
      echo "set \$color2 $color2" >> ~/.cache/wal/colors-sway
      echo "set \$color3 $color3" >> ~/.cache/wal/colors-sway
      echo "set \$color4 $color4" >> ~/.cache/wal/colors-sway
      echo "set \$color5 $color5" >> ~/.cache/wal/colors-sway
      echo "set \$color6 $color6" >> ~/.cache/wal/colors-sway
      echo "set \$color7 $color7" >> ~/.cache/wal/colors-sway
      echo "set \$color8 $color8" >> ~/.cache/wal/colors-sway
      echo "set \$color9 $color9" >> ~/.cache/wal/colors-sway
      echo "set \$color10 $color10" >> ~/.cache/wal/colors-sway
      echo "set \$color11 $color11" >> ~/.cache/wal/colors-sway
      echo "set \$color12 $color12" >> ~/.cache/wal/colors-sway
      echo "set \$color13 $color13" >> ~/.cache/wal/colors-sway
      echo "set \$color14 $color14" >> ~/.cache/wal/colors-sway
      echo "set \$color15 $color15" >> ~/.cache/wal/colors-sway
      echo "set \$background $background" >> ~/.cache/wal/colors-sway
      echo "set \$foreground $foreground" >> ~/.cache/wal/colors-sway

      # Apply colors to borders immediately
      swaymsg "client.focused $color5 $color5 $color0 $color5 $color5"
      swaymsg "client.focused_inactive $color1 $color1 $color5 $color1 $color1"
      swaymsg "client.unfocused $color1 $color1 $color5 $color1 $color1"
      swaymsg "client.urgent $color2 $color2 $color0 $color2 $color2"
      swaymsg "client.placeholder $color0 $color0 $color5 $color0 $color0"
      swaymsg "client.background $background"
    fi
  '';

  # 1.5 Define theme manager using wofi
  themeManager = pkgs.writeShellScriptBin "theme-manager" ''
    #!/bin/sh
    THEME_DIR="$HOME/.config/halix-themes"
    CURRENT_WP_FILE="/tmp/current_wallpaper"
    mkdir -p "$THEME_DIR"

    # Define menu options
    OPTIONS="1. Apply Theme\n2. Save Current Theme\n3. Rename Theme\n4. Delete Theme\n5. Random Wallpaper"

    CHOICE=$(echo -e "$OPTIONS" | wofi --show dmenu --prompt "Theme Manager" --conf ${wofiTheme.config} --style ${wofiTheme.style} | cut -d'.' -f1)

    case "$CHOICE" in
      1)
        # Apply Theme
        THEMES=$(ls -1 "$THEME_DIR" 2>/dev/null)
        if [ -z "$THEMES" ]; then
          echo "No saved themes." | wofi --show dmenu --prompt "Error" --conf ${wofiTheme.config} --style ${wofiTheme.style}
          exit 0
        fi
        SELECTED=$(echo "$THEMES" | wofi --show dmenu --prompt "Select Theme" --conf ${wofiTheme.config} --style ${wofiTheme.style})
        if [ -n "$SELECTED" ] && [ -f "$THEME_DIR/$SELECTED" ]; then
          TARGET=$(cat "$THEME_DIR/$SELECTED")
          exec ${wallpaperTransition} "$TARGET"
        fi
        ;;
      2)
        # Save Current Theme
        if [ -f "$CURRENT_WP_FILE" ]; then
          CURRENT_WP=$(cat "$CURRENT_WP_FILE")
          NAME=$(echo "" | wofi --show dmenu --prompt "Enter Theme Name" --conf ${wofiTheme.config} --style ${wofiTheme.style})
          if [ -n "$NAME" ]; then
            echo "$CURRENT_WP" > "$THEME_DIR/$NAME"
          fi
        fi
        ;;
      3)
        # Rename Theme
        THEMES=$(ls -1 "$THEME_DIR" 2>/dev/null)
        if [ -z "$THEMES" ]; then exit 0; fi
        SELECTED=$(echo "$THEMES" | wofi --show dmenu --prompt "Select Theme to Rename" --conf ${wofiTheme.config} --style ${wofiTheme.style})
        if [ -n "$SELECTED" ] && [ -f "$THEME_DIR/$SELECTED" ]; then
          NEW_NAME=$(echo "" | wofi --show dmenu --prompt "Enter New Name for $SELECTED" --conf ${wofiTheme.config} --style ${wofiTheme.style})
          if [ -n "$NEW_NAME" ]; then
            mv "$THEME_DIR/$SELECTED" "$THEME_DIR/$NEW_NAME"
          fi
        fi
        ;;
      4)
        # Delete Theme
        THEMES=$(ls -1 "$THEME_DIR" 2>/dev/null)
        if [ -z "$THEMES" ]; then exit 0; fi
        SELECTED=$(echo "$THEMES" | wofi --show dmenu --prompt "Select Theme to Delete" --conf ${wofiTheme.config} --style ${wofiTheme.style})
        if [ -n "$SELECTED" ] && [ -f "$THEME_DIR/$SELECTED" ]; then
          rm "$THEME_DIR/$SELECTED"
        fi
        ;;
      5)
        # Random Wallpaper
        exec ${wallpaperTransition}
        ;;
    esac
  '';

  # 2. Define the actual Sway configuration content
  swayConfig = pkgs.writeText "sway-config" ''
        exec systemctl --user import-environment WAYLAND_DISPLAY XDG_CURRENT_DESKTOP DISPLAY XAUTHORITY
        exec dbus-update-activation-environment --systemd --all
        exec gnome-keyring-daemon --start --components=pkcs11,secrets,ssh

        # Create pywal cache dir and dummy files to prevent sway errors on first start
        exec mkdir -p ~/.cache/wal
        exec touch ~/.cache/wal/colors-sway ~/.cache/wal/colors-waybar.css ~/.cache/wal/sway-bg

        # Import pywal colors for window borders
        include ~/.cache/wal/colors-sway
        client.focused $color5 $color5 $color0 $color5 $color5
        client.focused_inactive $color1 $color1 $color5 $color1 $color1
        client.unfocused $color1 $color1 $color5 $color1 $color1
        client.urgent $color2 $color2 $color0 $color2 $color2
        client.placeholder $color0 $color0 $color5 $color0 $color0
        client.background $background

        # Run wallpaper transition which also starts waybar and awww
        exec_always ${wallpaperTransition}

        ### Variables
    #
    # Logo key. Use Mod1 for Alt.
    set $mod Mod4
    # Home row direction keys, like vim
    set $left h
    set $down j
    set $up k
    set $right l
    # Your preferred terminal emulator
    set $term ghostty
    # Your preferred application launcher
    set $menu wofi --show drun --conf ${wofiTheme.config} --style ${wofiTheme.style}

    # Allow XWayland apps (like Steam) to take focus when activating from tray
    focus_on_window_activation focus

    ### Output configuration
    #
    # awww takes care of the background drawing
    #

    # Example configuration:
    #
    #   output HDMI-A-1 resolution 1920x1080 position 1920,0

    ### Monitor Configuration
    # Left Monitor (Landscape)
    output DP-1 res 2560x1440 pos 0 0
    output DP-2 res 2560x1440 pos 2560 0
    # You can get the names of your outputs by running: swaymsg -t get_outputs

    ### Idle configuration
    #
    # Example configuration:
    #
    # exec swayidle -w \
    #          timeout 300 'swaylock -f -c 000000' \
    #          timeout 600 'swaymsg "output * power off"' resume 'swaymsg "output * power on"' \
    #          before-sleep 'swaylock -f -c 000000'
    #
    # This will lock your screen after 300 seconds of inactivity, then turn off
    # your displays after another 300 seconds, and turn your screens back on when
    # resumed. It will also lock your screen before your computer goes to sleep.

    ### Input configuration
    #
    # Example configuration:
    #
    #   input type:touchpad {
    #       dwt enabled
    #       tap enabled
    #       natural_scroll enabled
    #       middle_emulation enabled
    #   }
    #
    #   input type:keyboard {
    #       xkb_layout "eu"
    #   }
    #
    # You can also configure each device individually.
    # Read `man 5 sway-input` for more information about this section.

    # Enable NumLock on startup
    input type:keyboard {
        xkb_numlock enabled
    }

    ### Key bindings
    #
    # Basics:
    #
        # Start a terminal
        bindsym $mod+Return exec $term

        # Kill focused window
        bindsym $mod+q kill

        # Start your launcher
        bindsym $mod+d exec $menu

        # Drag floating windows by holding down $mod and left mouse button.
        # Resize them with right mouse button + $mod.
        # Despite the name, also works for non-floating windows.
        # Change normal to inverse to use left mouse button for resizing and right
        # mouse button for dragging.
        floating_modifier $mod normal

        # Reload the configuration file
        bindsym $mod+Shift+c reload

        # Smoothly transition to a new wallpaper and Pywal theme
        bindsym $mod+Shift+w exec ${wallpaperTransition}

        # Exit sway (logs you out of your Wayland session)
        bindsym $mod+Shift+e exec swaynag -t warning -m 'You pressed the exit shortcut. Do you really want to exit sway? This will end your Wayland session.' -B 'Yes, exit sway' 'swaymsg exit'
    #
    # Moving around:
    #
        # Move your focus around
        bindsym $mod+$left focus left
        bindsym $mod+$down focus down
        bindsym $mod+$up focus up
        bindsym $mod+$right focus right
        # Or use $mod+[up|down|left|right]
        bindsym $mod+Left focus left
        bindsym $mod+Down focus down
        bindsym $mod+Up focus up
        bindsym $mod+Right focus right

        # Move the focused window with the same, but add Shift
        bindsym $mod+Shift+$left move left
        bindsym $mod+Shift+$down move down
        bindsym $mod+Shift+$up move up
        bindsym $mod+Shift+$right move right
        # Ditto, with arrow keys
        bindsym $mod+Shift+Left move left
        bindsym $mod+Shift+Down move down
        bindsym $mod+Shift+Up move up
        bindsym $mod+Shift+Right move right
    #
    # Workspaces:
    #
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
        # Move focused container to workspace
        #bindsym $mod+Shift+1 move container to workspace number 1
        #bindsym $mod+Shift+2 move container to workspace number 2
        #bindsym $mod+Shift+3 move container to workspace number 3
        #bindsym $mod+Shift+4 move container to workspace number 4
        #bindsym $mod+Shift+5 move container to workspace number 5
        #bindsym $mod+Shift+6 move container to workspace number 6
        #bindsym $mod+Shift+7 move container to workspace number 7
        #bindsym $mod+Shift+8 move container to workspace number 8
        #bindsym $mod+Shift+9 move container to workspace number 9
        #bindsym $mod+Shift+0 move container to workspace number 10
        bindsym $mod+Shift+1 move container to workspace number 1, workspace number 1
        bindsym $mod+Shift+2 move container to workspace number 2, workspace number 2
        bindsym $mod+Shift+3 move container to workspace number 3, workspace number 3
        bindsym $mod+Shift+4 move container to workspace number 4, workspace number 4
        bindsym $mod+Shift+5 move container to workspace number 5, workspace number 5
        bindsym $mod+Shift+6 move container to workspace number 6, workspace number 6
        bindsym $mod+Shift+7 move container to workspace number 7, workspace number 7
        bindsym $mod+Shift+8 move container to workspace number 8, workspace number 8
        bindsym $mod+Shift+9 move container to workspace number 9, workspace number 9
        bindsym $mod+Shift+0 move container to workspace number 10, workspace number 10
        # Note: workspaces can have any name you want, not just numbers.
        # We just use 1-10 as the default.
    #
    # Layout stuff:
    #
        # You can "split" the current object of your focus with
        # $mod+b or $mod+v, for horizontal and vertical splits
        # respectively.
        bindsym $mod+b splith
        bindsym $mod+v splitv

        # Switch the current container between different layout styles
        bindsym $mod+s layout stacking
        bindsym $mod+w layout tabbed
        bindsym $mod+e layout toggle split

        # Make the current focus fullscreen
        bindsym $mod+f fullscreen

        # Toggle the current focus between tiling and floating mode
        bindsym $mod+Shift+space floating toggle

        # Swap focus between the tiling area and the floating area
        bindsym $mod+space focus mode_toggle

        # Move focus to the parent container
        bindsym $mod+a focus parent
    #
    # Scratchpad:
    #
        # Sway has a "scratchpad", which is a bag of holding for windows.
        # You can send windows there and get them back later.

        # Move the currently focused window to the scratchpad
        bindsym $mod+Shift+minus move scratchpad

        # Show the next scratchpad window or hide the focused scratchpad window.
        # If there are multiple scratchpad windows, this command cycles through them.
        bindsym $mod+minus scratchpad show
    #
    # Resizing containers:
    bindsym $mod+Mod1+Left  resize shrink width 10px
    bindsym $mod+Mod1+Down  resize grow height 10px
    bindsym $mod+Mod1+Up    resize shrink height 10px
    bindsym $mod+Mod1+Right resize grow width 10px
    bindsym $mod+Mod1+$left  resize shrink width 10px
    bindsym $mod+Mod1+$down  resize grow height 10px
    bindsym $mod+Mod1+$up    resize shrink height 10px
    bindsym $mod+Mod1+$right resize grow width 10px


    #
    # Utilities:
    #
        # Special keys to adjust volume via PulseAudio
        bindsym --locked XF86AudioMute exec pactl set-sink-mute \@DEFAULT_SINK@ toggle
        bindsym --locked XF86AudioLowerVolume exec pactl set-sink-volume \@DEFAULT_SINK@ -5%
        bindsym --locked XF86AudioRaiseVolume exec pactl set-sink-volume \@DEFAULT_SINK@ +5%
        bindsym --locked XF86AudioMicMute exec pactl set-source-mute \@DEFAULT_SOURCE@ toggle
        # Special keys to adjust brightness via brightnessctl
        bindsym --locked XF86MonBrightnessDown exec brightnessctl set 5%-
        bindsym --locked XF86MonBrightnessUp exec brightnessctl set 5%+
        # Capture the entire screen to clipboard
        bindsym Print exec grim - | wl-copy

        # Capture a selected area to clipboard
        bindsym $mod+Shift+s exec grim -g "$(slurp)" - | wl-copy

    #

  '';

  # 2. Use the wrapPackage function from the library
  mySway = wlib.wrapPackage {
    inherit pkgs;
    package = pkgs.sway;
    # Add runtime binaries to Sway's PATH so it can find swaybg, wofi, etc.
    runtimeInputs = with pkgs; [
      swww
      wofi
      ghostty
      grim
      slurp
      wl-clipboard
      gnome-keyring
      psmisc
      procps
      themeManager
    ];
    flags = {
      # Ensure there is an '=' here and a ';' at the end
      "--config" = "${swayConfig}";
    };
  };
in {
  programs.sway.enable = true;
  environment.systemPackages = [
    mySway
    themeManager
  ];
}
