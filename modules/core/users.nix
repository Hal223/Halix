{
  config,
  pkgs,
  ...
}: {
  # Define a user account. Don't forget to set a password with ‘passwd’.
  users.users.hal = {
    isNormalUser = true;
    description = "Hal";
    extraGroups = [
      "networkmanager"
      "wheel"
      "video"
      "audio"
      "disk"
      "docker"
    ];
  };
}
