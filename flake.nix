{
  description = "A very basic flake";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
    nixpkgs-master.url = "github:nixos/nixpkgs/master";
    wrappers.url = "github:Lassulus/wrappers";
    odysseus.url = "github:pewdiepie-archdaemon/odysseus/pull/1523/head";
    fresh.inputs.nixpkgs.follows = "nixpkgs";
    fresh.url = "github:sinelaw/fresh";
    #antigravity.url = "github:jacopone/antigravity-nix";
    yazi-plugins = {
      url = "github:yazi-rs/plugins";
      flake = false;
    };
    nixos-hardware.url = "github:NixOS/nixos-hardware/master";
  };

  outputs = {
    self,
    nixpkgs,
    fresh,
    wrappers,
    odysseus,
    nixos-hardware,
    #antigravity,
    ...
  } @ inputs: {
    nixosConfigurations = {
      halix = nixpkgs.lib.nixosSystem {
        specialArgs = {inherit inputs;};
        modules = [
          ./hosts/halix/configuration.nix
          odysseus.nixosModules.default
        ];
      };

      halix-laptop = nixpkgs.lib.nixosSystem {
        specialArgs = {inherit inputs;};
        modules = [
          ./hosts/halix-laptop/configuration.nix
          #odysseus.nixosModules.default
        ];
      };
      
      template = nixpkgs.lib.nixosSystem {
        specialArgs = {inherit inputs;};
        modules = [
          ./hosts/template/configuration.nix
          odysseus.nixosModules.default
        ];
      };
    };
  };
}
