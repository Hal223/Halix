{
  config,
  pkgs,
  inputs,
  ...
}: {
  imports = [
    # Include the results of the hardware scan (generate on the target machine using: nixos-generate-config)
    ./hardware-configuration.nix

    # ThinkPad P52s/T480 hardware quirks and optimizations
    inputs.nixos-hardware.nixosModules.lenovo-thinkpad-t480

    # Core system settings
    ../../modules/core

    # Desktop & Wayland (Comment/Uncomment depending on needs)
    ../../modules/desktop/wayland.nix
    ../../modules/desktop/fonts.nix
    ../../modules/desktop/display-manager.nix
    ../../modules/desktop/sway/sway.nix
    ../../modules/desktop/sway/waybar.nix

    # Services
    #../../modules/services/docker.nix
    #../../modules/services/syncthing.nix
    # ../../modules/services/ollama.nix
    #../../modules/services/mullvad-vpn.nix

    # Programs
    ../../modules/programs/common.nix
    ../../modules/programs/firefox.nix
    ../../modules/programs/media.nix
    ../../modules/programs/development.nix
    ../../modules/programs/yazi.nix
    # ../../modules/programs/steam.nix
    ../../modules/programs/terminal.nix
  ];

  # Set the hostName for the new computer
  networking.hostName = "halix-laptop";

  # Dotfiles: add stow packages here as this host grows a dotfiles profile
  # e.g. hal.dotfiles.stowPackages = [ "hypr" "ags" "sway" ];
  hal.dotfiles.stowPackages = [];

  nix.settings.experimental-features = [
    "nix-command"
    "flakes"
  ];

  nixpkgs.config.allowUnfree = true;

  # Change this to the version of NixOS installed on the new machine
  system.stateVersion = "26.05";

  # Performance and thermals for Intel 8th Gen ThinkPads
  services.throttled.enable = true;
  services.power-profiles-daemon.enable = true;
  services.tlp.enable = false;
}
