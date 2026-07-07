{
  pkgs,
  inputs,
  ...
}: {
  environment.systemPackages = [
    # Here we pull in the derivation we built in flake.nix!
    inputs.self.packages.${pkgs.system}.ags-shell
  ];

  # fonts.packages = with pkgs; [ ... ];
}
