{
  config,
  pkgs,
  ...
}: {
  imports = [
    # Include the results of the hardware scan (generate on the target machine using: nixos-generate-config)
    ./hardware-configuration.nix

    # Core system settings
    ../../modules/core/boot.nix
    ../../modules/core/networking.nix
    ../../modules/core/locale.nix
    ../../modules/core/users.nix
    ../../modules/core/audio.nix
    ../../modules/core/services.nix
    ../../modules/core/security.nix

    # Desktop & Wayland (Comment/Uncomment depending on needs)
    ../../modules/desktop/wayland.nix
    ../../modules/desktop/fonts.nix
    ../../modules/desktop/display-manager.nix
    ../../modules/desktop/sway/sway.nix
    ../../modules/desktop/sway/waybar.nix

    # Services
    ../../modules/services/docker.nix
    ../../modules/services/syncthing.nix
    # ../../modules/services/ollama.nix
    ../../modules/services/mullvad-vpn.nix

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
  networking.hostName = "halix-template";

  nix.settings.experimental-features = [
    "nix-command"
    "flakes"
  ];

  nixpkgs.config.allowUnfree = true;

  # Change this to the version of NixOS installed on the new machine
  system.stateVersion = "26.05";
}
