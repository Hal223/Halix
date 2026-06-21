{
  config,
  pkgs,
  ...
}: {
  networking.hostName = "halix";
  # Enable networking
  networking.networkmanager.enable = true;
}
