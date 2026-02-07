{
  description = "A very basic flake";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
    fresh.inputs.nixpkgs.follows = "nixpkgs";
    fresh.url = "github:sinelaw/fresh";
    #pia-vpn.url = "github:rcambrj/nix-pia-vpn";
    #pia-vpn.inputs.nixpkgs.follows = "nixpkgs";
    yazi-plugins = {
      url = "github:yazi-rs/plugins";
      flake = false;
    };
  };

  outputs = {
    self,
    nixpkgs,
    fresh,
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
