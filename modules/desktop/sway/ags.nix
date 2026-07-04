{
  pkgs,
  config,
  lib,
  ...
}: let
  patchedAgs = pkgs.ags_1.overrideAttrs (old: {
    postInstall =
      (old.postInstall or "")
      + ''
        sed -i 's/Repository.prepend_search_path/Repository.dup_default().prepend_search_path/g' $out/bin/ags || true
        sed -i 's/Repository.prepend_library_path/Repository.dup_default().prepend_library_path/g' $out/bin/ags || true
      '';
  });

  startAgs = pkgs.writeShellScriptBin "start-ags" ''
    #!/bin/sh
    # Ensure pywal has generated colors before starting AGS
    if [ ! -f ~/.cache/wal/colors-waybar.css ]; then
      mkdir -p ~/.cache/wal
      # Create empty fallback so AGS doesn't crash if wal hasn't run yet
      touch ~/.cache/wal/colors-waybar.css
    fi

    # Start AGS using the configuration managed by Home Manager
    ${patchedAgs}/bin/ags -c ~/.config/ags/config.js
  '';
in {
  environment.systemPackages = [
    patchedAgs
    startAgs
    pkgs.dart-sass
  ];
}
