{
  config,
  pkgs,
  ...
}: {
  # Bootloader.
  boot.loader.systemd-boot.enable = true;
  boot.loader.efi.canTouchEfiVariables = true;
  # fixes network flapping issue
  boot.kernelParams = ["pcie_aspm=off" "igc.EEE=0"];
}
