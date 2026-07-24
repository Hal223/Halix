{
  pkgs,
  inputs,
  lib,
  ...
}: let
  system = pkgs.system;
  astal = inputs.astal.packages.${system};
in {
  # ---------------------------------------------------------------------------
  # Hyprland – system-level enablement only.
  # The actual hyprland.conf lives in ~/Dotfiles-halix/hypr/.config/hypr/
  # and is symlinked into place by the stow activation script.
  # ---------------------------------------------------------------------------
  programs.hyprland = {
    enable = true;
    withUWSM = true;
    xwayland.enable = true;
  };

  xdg.portal.extraPortals = [pkgs.xdg-desktop-portal-hyprland];

  environment.systemPackages = [
    pkgs.kitty
    pkgs.hyprshot
    pkgs.swww
    pkgs.pywal
    pkgs.libpulseaudio # paplay for volume sound effects

    # -------------------------------------------------------------------------
    # AGS + Astal — binaries/GIR typelibs stay in Nix.
    # The TypeScript config lives in ~/Dotfiles-halix/ags/.config/ags/
    # and is symlinked by stow.  AGS is started via:
    #   exec-once = ags run ~/.config/ags   (in hyprland.conf)
    # -------------------------------------------------------------------------
    (inputs.ags.packages.${system}.default.override {
      extraPackages = [
        astal.astal4
        astal.io
        astal.hyprland
        astal.wireplumber
        astal.tray
        astal.network
        astal.bluetooth
      ];
    })
  ];
}
