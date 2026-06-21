{
  config,
  pkgs,
  lib,
  ...
}: {
  services.displayManager.ly.enable = true;
  services.displayManager.ly.settings.default_session = "sway";
  services.displayManager.defaultSession = "sway"; # Example for Sway

  #services.displayManager.cosmic-greeter.enable = true;
  services.desktopManager.cosmic.enable = true;
  services.xserver.desktopManager.cinnamon.enable = true;

  environment.systemPackages = with pkgs; [
    grim # screenshot functionality
    slurp # screenshot functionality
    wl-clipboard # wl-copy and wl-paste for copy/paste from stdin / stdout
    mako # notification system developed by swaywm maintainer
    gnome-keyring # Or use 'pass' or 'kwallet' depending on your desktop
    xdg-utils # Essential for opening external URLs/links
  ];

  # Enable the gnome-keyring secrets vault.
  # Will be exposed through DBus to programs willing to store secrets.
  #services.gnome.gnome-keyring.enable = true;
}
