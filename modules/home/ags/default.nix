{
  config,
  pkgs,
  osConfig,
  ...
}: {
  home.file.".config/ags" = {
    source = ../../desktop/sway/ags;
    recursive = true;
  };

  home.file.".config/ags/vars.js".text = ''
    export const JQ_PATH = "${pkgs.jq}/bin/jq";
    export const IS_LAPTOP = ${
      if osConfig.networking.hostName == "halix-laptop"
      then "true"
      else "false"
    };
  '';
}
