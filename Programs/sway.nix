{
  pkgs,
  inputs,
  ...
}: let
  # Access the wrappers library from your flake inputs
  wlib = inputs.wrappers.lib;
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

  # 2. Use the wrapPackage function from the library
  mySway = wlib.wrapPackage {
    inherit pkgs;
    package = pkgs.sway;
    # Add runtime binaries to Sway's PATH so it can find swaybg, wofi, etc.
    runtimeInputs = with pkgs; [
      swaybg
      wofi
      ghostty
      grim
      slurp
      wl-clipboard
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
  ];
}
