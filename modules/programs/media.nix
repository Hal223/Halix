{
  config,
  pkgs,
  ...
}: {
  environment.systemPackages = with pkgs; [
    discord
    spotify
    audacity
    vlc
    feh
  ];
}
