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
      extraProfile = "export DBUS_FATAL_WARNINGS=0";
    };
  };
}
