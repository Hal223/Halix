{
  description = "A very basic flake";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
    nixpkgs-master.url = "github:nixos/nixpkgs/master";
    wrappers.url = "github:Lassulus/wrappers";

    fresh.inputs.nixpkgs.follows = "nixpkgs";
    fresh.url = "github:sinelaw/fresh";

    yazi-plugins = {
      url = "github:yazi-rs/plugins";
      flake = false;
    };
  };

  outputs = {
    self,
    nixpkgs,
    fresh,
    wrappers,
    ...
  } @ inputs: {
    nixosConfigurations.halix = nixpkgs.lib.nixosSystem {
      specialArgs = {inherit inputs;};
      modules = [
        ./configuration.nix
      ];
    };
  };
}
