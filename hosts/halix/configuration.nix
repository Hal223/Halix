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
    ../../modules/desktop/sway/sway.nix
    ../../modules/desktop/sway/waybar.nix

    # Services
    ../../modules/services/docker.nix
    ../../modules/services/syncthing.nix
    ../../modules/services/ollama.nix
    ../../modules/services/mullvad-vpn.nix

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

  nix.settings.experimental-features = [
    "nix-command"
    "flakes"
  ];

  nixpkgs.config.allowUnfree = true;
  system.stateVersion = "26.05";

  home-manager.useGlobalPkgs = true;
  home-manager.useUserPackages = true;
  home-manager.extraSpecialArgs = {inherit inputs;};
  home-manager.users.hal = import ./home.nix;
}
