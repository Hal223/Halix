{
  inputs,
  pkgs,
  ...
}: let
  # Pass 'pkgs' as the first argument to wrapPackage
  waybar-wrapped = inputs.wrappers.lib.wrapPackage pkgs pkgs.waybar {
    # Using flags to point to the configuration
    flags = [
      "-c ${./waybar-config.json}"
      "-s ${./style.css}"
    ];
  };
in {
  environment.systemPackages = [waybar-wrapped];
}
