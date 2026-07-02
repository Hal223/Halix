{
  config,
  pkgs,
  ...
}: {
  fonts = {
    packages = with pkgs; [
      nerd-fonts.fira-code
      vista-fonts
      noto-fonts
      noto-fonts-cjk-sans
      noto-fonts-color-emoji
      font-awesome
    ];

    fontconfig = {
      enable = true;
      defaultFonts = {
        serif = ["Noto Serif" "Noto Color Emoji"];
        sansSerif = ["Noto Sans" "Noto Color Emoji"];
        monospace = ["FiraCode Nerd Font Mono" "Noto Color Emoji"];
        emoji = ["Noto Color Emoji"];
      };
    };
  };
}
