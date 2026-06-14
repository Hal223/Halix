{
  description = "A very basic flake";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
    nixpkgs-master.url = "github:nixos/nixpkgs/master";
    wrappers.url = "github:Lassulus/wrappers";
    odysseus.url = "github:pewdiepie-archdaemon/odysseus/pull/1523/head";
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
    odysseus,
    ...
  } @ inputs: {
    nixosConfigurations.halix = nixpkgs.lib.nixosSystem {
      specialArgs = {inherit inputs;};
      modules = [
        ./configuration.nix
        odysseus.nixosModules.default
      ];
    };
  };
}
