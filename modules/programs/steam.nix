{
  pkgs,
  lib,
  ...
}: {
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
          protonup-qt
          # Add extra dependencies here if needed (e.g., openssl, nghttp2)
        ];
      extraProfile = ''
        export DBUS_FATAL_WARNINGS=0
        export GDK_BACKEND=x11
      '';
    };
  };

  # 3. Force Steam to open its window when launched from Wofi and fix tray icon
  environment.systemPackages = with pkgs; [
    (writeShellScriptBin "steam-launcher" ''
      export DBUS_FATAL_WARNINGS=0
      export GDK_BACKEND=x11

      if [ -z "$1" ] || [ "$1" = "%U" ] || [ "$1" = "%u" ]; then
        exec steam steam://store
      else
        exec steam "$@"
      fi
    '')
    (lib.hiPrio (runCommand "steam-desktop-override" {} ''
      mkdir -p $out/share/applications
      cp ${steam}/share/applications/steam.desktop $out/share/applications/steam.desktop
      sed -i 's/^Exec=steam %U/Exec=steam-launcher %U/' $out/share/applications/steam.desktop
    ''))
  ];
}
