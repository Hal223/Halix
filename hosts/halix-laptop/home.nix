{
  config,
  pkgs,
  ...
}: {
  imports = [
    ../../modules/home/ags.nix
  ];

  home.username = "hal";
  home.homeDirectory = "/home/hal";

  home.stateVersion = "24.05";
  programs.home-manager.enable = true;
}
