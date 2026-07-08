{
  config,
  pkgs,
  ...
}: {
  # Enable the X11 windowing system.
  services.xserver.enable = true;

  # Configure keymap in X11
  services.xserver.xkb = {
    layout = "us";
    variant = "";
  };

  xdg.portal = {
    enable = true;
    wlr = {
      enable = true; # Required for wlroots-based compositors like Sway
      settings = {
        screencast = {
          max_fps = 30;
        };
      };
    };
    extraPortals = [pkgs.xdg-desktop-portal-gtk];
    config.sway.default = [
      "wlr"
      "gtk"
    ];
  };

  environment.sessionVariables = {
    NIXOS_OZONE_WL = "1"; # Tells Electron apps (like Discord) to use Wayland
    XDG_CURRENT_DESKTOP = "sway"; # Helps portals identify the environment
    GTK_THEME = "Adwaita:dark"; # Force a dark theme for GTK apps and Waybar's tray menus
  };

  # Enable dconf (required for many GTK apps and themes to work properly)
  programs.dconf.enable = true;
}
