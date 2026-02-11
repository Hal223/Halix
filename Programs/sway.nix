{
  pkgs,
  inputs,
  ...
}: let
  # Access the wrappers library from your flake inputs
  wlib = inputs.wrappers.lib.${pkgs.stdenv.hostPlatform.system};

  # 1. Define the actual Sway configuration content
  swayConfig = pkgs.writeText "sway-config" ''
    # --- Migrated Homeless Config ---
    exec systemctl --user import-environment WAYLAND_DISPLAY XDG_CURRENT_DESKTOP
    exec dbus-update-activation-environment --systemd WAYLAND_DISPLAY XDG_CURRENT_DESKTOP=sway

    # Variables (Using absolute paths ensures portability)
    set $mod Mod4
    set $term ${pkgs.ghostty}/bin/ghostty
    set $menu ${pkgs.wofi}/bin/wofi --show drun

    # Monitor Setup
    output DP-1 res 2560x1440 pos 0 0
    output DP-2 res 2560x1440 pos 2560 0

    # Keybindings
    bindsym $mod+Return exec $term
    bindsym $mod+q kill
    bindsym $mod+d exec $menu
    bindsym $mod+Shift+c reload

    # Workspaces
    workspace 1 output DP-1
    workspace 6 output DP-2
    bindsym $mod+1 workspace number 1
    bindsym $mod+6 workspace number 6
    # ... (add remaining bindings)

    # Utilities
    bindsym Print exec ${pkgs.grim}/bin/grim - | ${pkgs.wl-clipboard}/bin/wl-copy

    bar {
        position top
        status_command while date +'%Y-%m-%d %X'; do sleep 1; done
    }
  '';

  # 2. Wrap the Sway package to use the config above [00:03:22]
  mySway = wlib.wrapPackage {
    package = pkgs.sway;
    # Force Sway to use the Nix store config instead of ~/.config/sway
    flags = ["--config" "${swayConfig}"];
  };
in {
  # Enable the base system features for Sway
  programs.sway.enable = true;

  # Add the wrapped version to your system packages
  environment.systemPackages = [
    mySway
  ];
}
