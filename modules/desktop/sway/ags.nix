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

  agsVars = pkgs.writeText "vars.js" ''
    export const JQ_PATH = "${pkgs.jq}/bin/jq";
    export const IS_LAPTOP = ${
      if config.networking.hostName == "halix-laptop"
      then "true"
      else "false"
    };
  '';

  agsConfigDir = pkgs.runCommand "ags-config" {} ''
    mkdir -p $out
    cp ${./ags/config.js} $out/config.js
    cp ${./ags/style.css} $out/style.css
    cp ${agsVars} $out/vars.js
  '';

  startAgs = pkgs.writeShellScriptBin "start-ags" ''
    #!/bin/sh
    # Ensure pywal has generated colors before starting AGS
    if [ ! -f ~/.cache/wal/colors-waybar.css ]; then
      mkdir -p ~/.cache/wal
      # Create empty fallback so AGS doesn't crash if wal hasn't run yet
      touch ~/.cache/wal/colors-waybar.css
    fi

    # Start AGS with our custom config directory
    ${patchedAgs}/bin/ags -c ${agsConfigDir}/config.js
  '';
in {
  environment.systemPackages = [
    patchedAgs
    startAgs
  ];
}
