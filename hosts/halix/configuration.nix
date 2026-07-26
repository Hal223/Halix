{
  config,
  pkgs,
  inputs,
  ...
}: {
  imports = [
    ./hardware-configuration.nix

    # Core system settings
    ../../modules/core

    # Desktop & Wayland
    ../../modules/desktop/wayland.nix
    ../../modules/desktop/fonts.nix
    ../../modules/desktop/display-manager.nix
    ../../modules/desktop/hyprland/hyprland.nix

    # Services
    ../../modules/services/docker.nix
    ../../modules/services/syncthing.nix
    ../../modules/services/ollama.nix
    #../../modules/services/mullvad-vpn.nix

    # Programs
    ../../modules/programs/common.nix
    ../../modules/programs/firefox.nix
    ../../modules/programs/media.nix
    ../../modules/programs/development.nix
    ../../modules/programs/yazi.nix
    ../../modules/programs/steam.nix
    ../../modules/programs/terminal.nix
  ];

  networking.hostName = "halix";

  # Dotfiles: stow these packages from ~/Dotfiles-halix into ~/
  hal.dotfiles.stowPackages = [
    "hypr"
    "ags"
  ];

  nix.settings.experimental-features = [
    "nix-command"
    "flakes"
  ];

  nixpkgs.config.allowUnfree = true;
  system.stateVersion = "26.05";
}
