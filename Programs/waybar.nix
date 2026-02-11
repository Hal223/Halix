{
  inputs,
  pkgs,
  ...
}: let
  waybar-wrapped = inputs.wrappers.lib.wrapPackage pkgs {
    package = pkgs.waybar; # Explicitly passing the 'package' argument
    flags = [
      "-c ${./waybar-config.json}"
      "-s ${./style.css}"
    ];
  };
in {
  environment.systemPackages = [waybar-wrapped];
}
