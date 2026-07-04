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

  # This value determines the Home Manager release that your configuration is
  # compatible with. This helps avoid breakage when a new Home Manager release
  # introduces backwards incompatible changes.
  home.stateVersion = "24.05";

  # Let Home Manager install and manage itself.
  programs.home-manager.enable = true;
}
