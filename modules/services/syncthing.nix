{
  config,
  pkgs,
  ...
}: {
  services.syncthing = {
    enable = true;
    user = "hal";
    dataDir = "/home/hal/Sync";
    configDir = "/home/hal/.config/syncthing";
  };
}
