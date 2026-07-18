{
  config,
  pkgs,
  ...
}: {
  environment.systemPackages = with pkgs; [
    discord
    r2modman
    webcord
    spotify
    audacity
    vlc
    feh
  ];
}
