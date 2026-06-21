{
  config,
  pkgs,
  ...
}: {
  fonts.packages = with pkgs; [
    nerd-fonts.fira-code
    vista-fonts
  ];
}
