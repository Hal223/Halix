{
  inputs,
  pkgs,
  ...
}: let
  # The video highlights using the 'wrapPackage' function for a clean syntax
  waybar-wrapped = inputs.wrappers.lib.wrapPackage pkgs.waybar {
    # Using flags to point to the configuration
    flags = [
      "-c ${./waybar-config.json}"
      "-s ${./style.css}"
    ];
  };
in {
  environment.systemPackages = [waybar-wrapped];
}
