{
  description = "A very basic flake";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
    nixpkgs-master.url = "github:nixos/nixpkgs/master";
    wrappers.url = "github:Lassulus/wrappers";
    odysseus.url = "github:pewdiepie-archdaemon/odysseus/pull/1523/head";
    fresh.inputs.nixpkgs.follows = "nixpkgs";
    fresh.url = "github:sinelaw/fresh";
    home-manager = {
      url = "github:nix-community/home-manager";
      inputs.nixpkgs.follows = "nixpkgs";
    };
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
    home-manager,
    #antigravity,
    ...
  } @ inputs: {
    nixosConfigurations = {
      halix = nixpkgs.lib.nixosSystem {
        specialArgs = {inherit inputs;};
        modules = [
          ./hosts/halix/configuration.nix
          odysseus.nixosModules.default
          home-manager.nixosModules.home-manager
          {
            home-manager.useGlobalPkgs = true;
            home-manager.useUserPackages = true;
            home-manager.extraSpecialArgs = {inherit inputs;};
            home-manager.users.hal = import ./hosts/halix/home.nix;
          }
        ];
      };

      halix-laptop = nixpkgs.lib.nixosSystem {
        specialArgs = {inherit inputs;};
        modules = [
          ./hosts/halix-laptop/configuration.nix
          #odysseus.nixosModules.default
          home-manager.nixosModules.home-manager
          {
            home-manager.useGlobalPkgs = true;
            home-manager.useUserPackages = true;
            home-manager.extraSpecialArgs = {inherit inputs;};
            home-manager.users.hal = import ./hosts/halix-laptop/home.nix;
          }
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
