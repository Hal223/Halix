{
  config,
  pkgs,
  inputs,
  ...
}: {
  imports = [
    ./hardware-configuration.nix

    # Hardware optimizations for Dell Precision (Tiger Lake-H / NVMe SSD)
    inputs.nixos-hardware.nixosModules.common-cpu-intel
    inputs.nixos-hardware.nixosModules.common-pc-laptop-ssd

    # Core system settings
    ../../modules/core

    # Desktop & Wayland (Comment/Uncomment depending on needs)
    ../../modules/desktop/wayland.nix
    ../../modules/desktop/fonts.nix
    ../../modules/desktop/display-manager.nix
    #../../modules/desktop/hyprland/hyprland.nix

    # Services
    #../../modules/services/docker.nix
    ../../modules/services/syncthing.nix
    # ../../modules/services/ollama.nix
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

  # Set the hostName for the new computer
  networking.hostName = "halix-laptop";

  # Dotfiles: add stow packages here as this host grows a dotfiles profile
  hal.dotfiles.stowPackages = [
    "hypr"
    "ags"
  ];

  nix.settings.experimental-features = [
    "nix-command"
    "flakes"
  ];

  nixpkgs.config.allowUnfree = true;

  # Change this to the version of NixOS installed on the new machine
  system.stateVersion = "26.05";

  # Firmware and microcode
  hardware.enableRedistributableFirmware = true;

  # Power management & thermals
  services.power-profiles-daemon.enable = true;
  services.thermald.enable = true;

  # Intel Hardware Acceleration (VA-API / QuickSync)
  hardware.graphics = {
    enable = true;
    enable32Bit = true;
    extraPackages = with pkgs; [
      intel-media-driver
      vpl-gpu-rt
    ];
  };

  # NVIDIA RTX A3000 Mobile + Intel PRIME Offload
  services.xserver.videoDrivers = ["nvidia"];

  hardware.nvidia = {
    modesetting.enable = true;
    powerManagement = {
      enable = true;
      finegrained = true; # Powers off RTX A3000 when idle to save battery
    };
    open = false; # Proprietary drivers recommended for mobile Ampere workstation GPUs
    nvidiaSettings = true;
    prime = {
      offload = {
        enable = true;
        enableOffloadCmd = true; # Adds `nvidia-offload` CLI wrapper
      };
      intelBusId = "PCI:0:2:0";
      nvidiaBusId = "PCI:1:0:0";
    };
  };
}
