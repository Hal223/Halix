{
  description = "Halix NixOS configuration";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";

    yazi-plugins = {
      url = "github:yazi-rs/plugins";
      flake = false;
    };

    astal = {
      url = "github:aylur/astal";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    ags = {
      url = "github:aylur/ags";
      inputs.nixpkgs.follows = "nixpkgs";
      inputs.astal.follows = "astal";
    };

    nixos-hardware.url = "github:NixOS/nixos-hardware/master";

    wrappers.url = "github:Lassulus/wrappers";
  };

  outputs = {
    self,
    nixpkgs,
    nixos-hardware,
    ags,
    astal,
    ...
  } @ inputs: let
    system = "x86_64-linux";
    pkgs = nixpkgs.legacyPackages.${system};
  in {
    nixosConfigurations = {
      halix = nixpkgs.lib.nixosSystem {
        specialArgs = {inherit inputs;};
        modules = [
          ./hosts/halix/configuration.nix
        ];
      };

      halix-laptop = nixpkgs.lib.nixosSystem {
        specialArgs = {inherit inputs;};
        modules = [
          ./hosts/halix-laptop/configuration.nix
        ];
      };

      template = nixpkgs.lib.nixosSystem {
        specialArgs = {inherit inputs;};
        modules = [
          ./hosts/template/configuration.nix
        ];
      };
    };
  };
}
