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
          chooser_type = "simple";
          chooser_cmd = "${pkgs.slurp}/bin/slurp -f %o -or";
        };
      };
    };
    extraPortals = [pkgs.xdg-desktop-portal-gtk];
    config.common.default = [
      "wlr"
      "gtk"
    ];
  };

  environment.sessionVariables = {
    NIXOS_OZONE_WL = "1"; # Tells Electron apps (like Discord) to use Wayland
    XDG_CURRENT_DESKTOP = "sway"; # Helps portals identify the environment
  };
}
