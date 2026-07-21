{
  config,
  pkgs,
  ...
}: {
  imports = [
    ./audio.nix
    ./boot.nix
    ./dotfiles.nix
    ./locale.nix
    ./networking.nix
    ./security.nix
    ./services.nix
    ./users.nix
  ];
}
