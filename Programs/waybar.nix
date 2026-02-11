{
  inputs,
  pkgs,
  ...
}: let
  # Try positional: pkgs -> the package to wrap -> the config set
  waybar-wrapped = inputs.wrappers.lib.wrapPackage pkgs pkgs.waybar {
    flags = [
      "-c ${./waybar-config.json}"
      "-s ${./style.css}"
    ];
  };
in {
  environment.systemPackages = [waybar-wrapped];
}
