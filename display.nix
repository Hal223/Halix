{
  config,
  pkgs,
  lib,
  ...
}: {
  # 1. Enable COSMIC Desktop Environment (Epoch)
  services.displayManager.ly.enable = true;
  services.displayManager.ly.settings.default_session = "Sway";
  #services.displayManager.ly.settings.default_session = "/run/current-system/sw/share/wayland-sessions/sway.desktop";
  services.displayManager.defaultSession = "Sway"; # Example for Sway

  #services.desktopManager.cosmic.enable = true;
  services.xserver.desktopManager.cinnamon.enable = true;

  environment.systemPackages = with pkgs; [
    grim # screenshot functionality
    slurp # screenshot functionality
    wl-clipboard # wl-copy and wl-paste for copy/paste from stdin / stdout
    mako # notification system developed by swaywm maintainer
  ];

  # Enable the gnome-keyring secrets vault.
  # Will be exposed through DBus to programs willing to store secrets.
  services.gnome.gnome-keyring.enable = true;

  # enable Sway window manager
  programs.sway = {
    enable = true;
    wrapperFeatures.gtk = true;
  };
}
