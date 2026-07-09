{
  pkgs,
  inputs,
  ...
}: let
  wlib = inputs.wrappers.lib;
  wofiTheme = import ../sway/wofi.nix {inherit pkgs;};

  wallpaperTransition = pkgs.writeShellScript "wallpaper-transition-hyprland" ''
    #!/bin/sh

    LOCKFILE="/tmp/wallpaper-transition-hyprland.lock"
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

    if [ -z "$WP" ] && [ -d "$WP_DIR" ]; then
      WP=$(${pkgs.findutils}/bin/find "$WP_DIR" -type f | ${pkgs.coreutils}/bin/shuf -n1)
    fi

    if [ -n "$WP" ]; then
      echo "$WP" > "$CURRENT_WP_FILE"
      ${pkgs.pywal16}/bin/wal -i "$WP" -n -q

      if ! ${pkgs.procps}/bin/pgrep -f "awww-daemon" > /dev/null; then
        ${pkgs.swww}/bin/awww-daemon 9>&- >/dev/null 2>&1 &
        ${pkgs.coreutils}/bin/sleep 2
      fi

      for i in 1 2 3 4 5; do
        if ${pkgs.swww}/bin/awww img "$WP" --transition-type wave --transition-angle 30 --transition-step 120 --transition-duration 0.8 --transition-fps 60 --filter Bilinear; then
          break
        fi
        ${pkgs.coreutils}/bin/sleep 1
      done

      ${pkgs.psmisc}/bin/killall swaybg || true
      ${pkgs.psmisc}/bin/killall hyprpaper || true
    fi

    # Restart Waybar/AGS
    ${pkgs.psmisc}/bin/killall .waybar-wrapped || true
    ${pkgs.psmisc}/bin/killall waybar || true

    exec 9>&-

    PATH="/run/wrappers/bin:/run/current-system/sw/bin:$PATH" start-waybar >/dev/null 2>&1 &

    if [ -f ~/.cache/wal/colors.sh ]; then
      . ~/.cache/wal/colors.sh
      echo "\$color0 = rgb(''${color0:1})" > ~/.cache/wal/colors-hyprland.conf
      echo "\$color1 = rgb(''${color1:1})" >> ~/.cache/wal/colors-hyprland.conf
      echo "\$color2 = rgb(''${color2:1})" >> ~/.cache/wal/colors-hyprland.conf
      echo "\$color3 = rgb(''${color3:1})" >> ~/.cache/wal/colors-hyprland.conf
      echo "\$color4 = rgb(''${color4:1})" >> ~/.cache/wal/colors-hyprland.conf
      echo "\$color5 = rgb(''${color5:1})" >> ~/.cache/wal/colors-hyprland.conf
      echo "\$color6 = rgb(''${color6:1})" >> ~/.cache/wal/colors-hyprland.conf
      echo "\$color7 = rgb(''${color7:1})" >> ~/.cache/wal/colors-hyprland.conf
      echo "\$color8 = rgb(''${color8:1})" >> ~/.cache/wal/colors-hyprland.conf
      echo "\$color9 = rgb(''${color9:1})" >> ~/.cache/wal/colors-hyprland.conf
      echo "\$color10 = rgb(''${color10:1})" >> ~/.cache/wal/colors-hyprland.conf
      echo "\$color11 = rgb(''${color11:1})" >> ~/.cache/wal/colors-hyprland.conf
      echo "\$color12 = rgb(''${color12:1})" >> ~/.cache/wal/colors-hyprland.conf
      echo "\$color13 = rgb(''${color13:1})" >> ~/.cache/wal/colors-hyprland.conf
      echo "\$color14 = rgb(''${color14:1})" >> ~/.cache/wal/colors-hyprland.conf
      echo "\$color15 = rgb(''${color15:1})" >> ~/.cache/wal/colors-hyprland.conf
      echo "\$background = rgb(''${background:1})" >> ~/.cache/wal/colors-hyprland.conf
      echo "\$foreground = rgb(''${foreground:1})" >> ~/.cache/wal/colors-hyprland.conf

      # Apply to active hyprland instance
      if ${pkgs.procps}/bin/pgrep -x "Hyprland" > /dev/null; then
        hyprctl keyword general:col.active_border "rgba(''${color5:1}ff) rgba(''${color5:1}ff) 45deg"
        hyprctl keyword general:col.inactive_border "rgba(''${color1:1}ff) rgba(''${color1:1}ff) 45deg"
      fi
    fi
  '';

  themeManager = pkgs.writeShellScriptBin "theme-manager" ''
    #!/bin/sh
    THEME_DIR="$HOME/.config/halix-themes"
    CURRENT_WP_FILE="/tmp/current_wallpaper"
    mkdir -p "$THEME_DIR"
    OPTIONS="1. Apply Theme\n2. Save Current Theme\n3. Rename Theme\n4. Delete Theme\n5. Random Wallpaper"
    CHOICE=$(echo -e "$OPTIONS" | wofi --show dmenu --prompt "Theme Manager" --conf ${wofiTheme.config} --style ${wofiTheme.style} | cut -d'.' -f1)
    case "$CHOICE" in
      1)
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
        if [ -f "$CURRENT_WP_FILE" ]; then
          CURRENT_WP=$(cat "$CURRENT_WP_FILE")
          NAME=$(echo "" | wofi --show dmenu --prompt "Enter Theme Name" --conf ${wofiTheme.config} --style ${wofiTheme.style})
          if [ -n "$NAME" ]; then
            echo "$CURRENT_WP" > "$THEME_DIR/$NAME"
          fi
        fi
        ;;
      3)
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
        THEMES=$(ls -1 "$THEME_DIR" 2>/dev/null)
        if [ -z "$THEMES" ]; then exit 0; fi
        SELECTED=$(echo "$THEMES" | wofi --show dmenu --prompt "Select Theme to Delete" --conf ${wofiTheme.config} --style ${wofiTheme.style})
        if [ -n "$SELECTED" ] && [ -f "$THEME_DIR/$SELECTED" ]; then
          rm "$THEME_DIR/$SELECTED"
        fi
        ;;
      5)
        exec ${wallpaperTransition}
        ;;
    esac
  '';

  hyprlandConfig = pkgs.writeText "hyprland-config" ''
    exec-once = dbus-update-activation-environment --systemd WAYLAND_DISPLAY XDG_CURRENT_DESKTOP DISPLAY XAUTHORITY
    exec-once = systemctl --user import-environment WAYLAND_DISPLAY XDG_CURRENT_DESKTOP DISPLAY XAUTHORITY
    exec-once = gnome-keyring-daemon --start --components=pkcs11,secrets,ssh

    exec-once = mkdir -p ~/.cache/wal && touch ~/.cache/wal/colors-hyprland.conf ~/.cache/wal/colors-waybar.css
    source = ~/.cache/wal/colors-hyprland.conf

    # Startup transition
    exec-once = ${wallpaperTransition}

    monitor=DP-1,2560x1440,0x0,1
    monitor=DP-2,2560x1440,2560x0,1

    workspace = 1, monitor:DP-1
    workspace = 2, monitor:DP-1
    workspace = 3, monitor:DP-1
    workspace = 4, monitor:DP-1
    workspace = 5, monitor:DP-1
    workspace = 6, monitor:DP-2
    workspace = 7, monitor:DP-2
    workspace = 8, monitor:DP-2
    workspace = 9, monitor:DP-2
    workspace = 10, monitor:DP-2

    input {
        kb_layout = us
        numlock_by_default = true
        follow_mouse = 1
    }

    general {
        gaps_in = 5
        gaps_out = 10
        border_size = 2
        col.active_border = $color5
        col.inactive_border = $color1
        layout = dwindle
    }

    decoration {
        rounding = 0
        blur {
            enabled = true
            size = 3
            passes = 1
        }
    }

    animations {
        enabled = yes
        bezier = myBezier, 0.05, 0.9, 0.1, 1.05
        animation = windows, 1, 7, myBezier
        animation = windowsOut, 1, 7, default, popin 80%
        animation = border, 1, 10, default
        animation = fade, 1, 7, default
        animation = workspaces, 1, 6, default
    }

    dwindle {
        pseudotile = yes
        preserve_split = yes
    }

    master {
        # new_is_master = true
    }

    $mod = SUPER
    $term = ghostty
    $menu = wofi --show drun --conf ${wofiTheme.config} --style ${wofiTheme.style}

    bind = $mod, Return, exec, $term
    bind = $mod, q, killactive
    bind = $mod, d, exec, $menu
    bind = $mod SHIFT, c, exec, hyprctl reload
    bind = $mod SHIFT, w, exec, ${wallpaperTransition}
    bind = $mod SHIFT, e, exit

    # Focus
    bind = $mod, h, movefocus, l
    bind = $mod, j, movefocus, d
    bind = $mod, k, movefocus, u
    bind = $mod, l, movefocus, r
    bind = $mod, Left, movefocus, l
    bind = $mod, Down, movefocus, d
    bind = $mod, Up, movefocus, u
    bind = $mod, Right, movefocus, r

    # Move
    bind = $mod SHIFT, h, movewindow, l
    bind = $mod SHIFT, j, movewindow, d
    bind = $mod SHIFT, k, movewindow, u
    bind = $mod SHIFT, l, movewindow, r
    bind = $mod SHIFT, Left, movewindow, l
    bind = $mod SHIFT, Down, movewindow, d
    bind = $mod SHIFT, Up, movewindow, u
    bind = $mod SHIFT, Right, movewindow, r

    # Workspaces
    bind = $mod, 1, workspace, 1
    bind = $mod, 2, workspace, 2
    bind = $mod, 3, workspace, 3
    bind = $mod, 4, workspace, 4
    bind = $mod, 5, workspace, 5
    bind = $mod, 6, workspace, 6
    bind = $mod, 7, workspace, 7
    bind = $mod, 8, workspace, 8
    bind = $mod, 9, workspace, 9
    bind = $mod, 0, workspace, 10

    # Move to workspace
    bind = $mod SHIFT, 1, movetoworkspace, 1
    bind = $mod SHIFT, 2, movetoworkspace, 2
    bind = $mod SHIFT, 3, movetoworkspace, 3
    bind = $mod SHIFT, 4, movetoworkspace, 4
    bind = $mod SHIFT, 5, movetoworkspace, 5
    bind = $mod SHIFT, 6, movetoworkspace, 6
    bind = $mod SHIFT, 7, movetoworkspace, 7
    bind = $mod SHIFT, 8, movetoworkspace, 8
    bind = $mod SHIFT, 9, movetoworkspace, 9
    bind = $mod SHIFT, 0, movetoworkspace, 10

    # Layout toggles & Floating
    bind = $mod, e, togglesplit
    bind = $mod, f, fullscreen
    bind = $mod SHIFT, space, togglefloating

    # Scratchpad
    bind = $mod SHIFT, minus, movetoworkspacesilent, special:scratchpad
    bind = $mod, minus, togglespecialworkspace, scratchpad

    # Resize
    binde = $mod ALT, h, resizeactive, -10 0
    binde = $mod ALT, j, resizeactive, 0 10
    binde = $mod ALT, k, resizeactive, 0 -10
    binde = $mod ALT, l, resizeactive, 10 0
    binde = $mod ALT, Left, resizeactive, -10 0
    binde = $mod ALT, Down, resizeactive, 0 10
    binde = $mod ALT, Up, resizeactive, 0 -10
    binde = $mod ALT, Right, resizeactive, 10 0

    # Media
    bindel = , XF86AudioMute, exec, pactl set-sink-mute @DEFAULT_SINK@ toggle
    bindel = , XF86AudioLowerVolume, exec, pactl set-sink-volume @DEFAULT_SINK@ -5%
    bindel = , XF86AudioRaiseVolume, exec, pactl set-sink-volume @DEFAULT_SINK@ +5%
    bindel = , XF86AudioMicMute, exec, pactl set-source-mute @DEFAULT_SOURCE@ toggle
    bindel = , XF86MonBrightnessDown, exec, brightnessctl set 5%-
    bindel = , XF86MonBrightnessUp, exec, brightnessctl set 5%+

    # Screenshots
    bind = , Print, exec, grim - | wl-copy
    bind = $mod SHIFT, s, exec, grim -g "$(slurp)" - | wl-copy
  '';

  myHyprland = wlib.wrapPackage {
    inherit pkgs;
    package = pkgs.hyprland;
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
      "-c" = "${hyprlandConfig}";
    };
  };
in {
  programs.hyprland.enable = true;
  environment.systemPackages = [
    myHyprland
    themeManager
  ];
}
