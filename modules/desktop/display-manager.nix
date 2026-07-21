{
  config,
  pkgs,
  lib,
  ...
}: {
  services.displayManager.ly.enable = true;
  services.displayManager.ly.settings.default_session = "hyprland";
  services.displayManager.defaultSession = "hyprland";

  #services.displayManager.cosmic-greeter.enable = true;
  services.desktopManager.cosmic.enable = true;
  services.xserver.desktopManager.cinnamon.enable = true;

  security.pam.services.ly.enableGnomeKeyring = true;

  environment.systemPackages = with pkgs; [
    grim # screenshot functionality
    slurp # screenshot functionality
    wl-clipboard # wl-copy and wl-paste for copy/paste from stdin / stdout
    mako # notification system
    gnome-keyring # Or use 'pass' or 'kwallet' depending on your desktop
    xdg-utils # Essential for opening external URLs/links
  ];
}
