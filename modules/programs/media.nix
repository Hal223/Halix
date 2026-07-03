{
  config,
  pkgs,
  ...
}: {
  environment.systemPackages = with pkgs; [
    discord
    webcord
    spotify
    audacity
    vlc
    feh
  ];
}
