{
  config,
  pkgs,
  ...
}: {
  environment.systemPackages = with pkgs; [
    discord
    vesktop
    spotify
    audacity
    vlc
    feh
  ];
}
