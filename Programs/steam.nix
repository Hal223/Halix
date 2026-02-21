{pkgs, ...}: {
  # 2. Enable Steam with multi-drive / networking support
  programs.steam = {
    enable = true;
    remotePlay.openFirewall = true;
    dedicatedServer.openFirewall = true;
    localNetworkGameTransfers.openFirewall = true;
  };
  # Override the desktop item
  environment.systemPackages = [
    (pkgs.steam.override {
      extraPkgs = pkgs:
        with pkgs; [
          # Add any extra dependencies here if needed
        ];
    }).overrideAttrs
    (oldAttrs: {
      postInstall =
        (oldAttrs.postInstall or "")
        + ''
          substituteInPlace $out/share/applications/steam.desktop \
            --replace "Exec=/usr/bin/steam" "Exec=env DBUS_FATAL_WARNINGS=0 steam" \
            --replace "Exec=steam" "Exec=env DBUS_FATAL_WARNINGS=0 steam"
        '';
    })
  ];
}
