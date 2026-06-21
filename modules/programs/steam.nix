{pkgs, ...}: {
  # 1. Enable Steam with multi-drive / networking support
  programs.steam = {
    enable = true;
    remotePlay.openFirewall = true;
    dedicatedServer.openFirewall = true;
    localNetworkGameTransfers.openFirewall = true;

    # 2. Declaratively override the Steam package itself
    package = pkgs.steam.override {
      extraPkgs = pkgs:
        with pkgs; [
          # Add extra dependencies here if needed (e.g., openssl, nghttp2)
        ];
    };
  };

  # 3. Use an overlay to fix the .desktop file globally
  # This ensures the COSMIC menu uses the correct environment variables
  nixpkgs.overlays = [
    (final: prev: {
      steam = prev.steam.overrideAttrs (oldAttrs: {
        postInstall =
          (oldAttrs.postInstall or "")
          + ''
            substituteInPlace $out/share/applications/steam.desktop \
              --replace "Exec=/usr/bin/steam" "Exec=env DBUS_FATAL_WARNINGS=0 steam" \
              --replace "Exec=steam" "Exec=env DBUS_FATAL_WARNINGS=0 steam"
          '';
      });
    })
  ];
}
