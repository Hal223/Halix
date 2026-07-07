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
  };

  outputs = {
    self,
    nixpkgs,
    fresh,
    wrappers,
    nixos-hardware,
    ags,
    astal,
    ...
  } @ inputs: let
    system = "x86_64-linux";
    pkgs = nixpkgs.legacyPackages.${system};
  in {
    packages.${system}.ags-shell = pkgs.stdenv.mkDerivation {
      pname = "ags-shell";
      src = ./ags;

      nativeBuildInputs = with pkgs; [
        wrapGAppsHook3
        gobject-introspection
        ags.packages.${system}.default
      ];

      buildInputs = [
        pkgs.glib
        pkgs.gjs
        astal.io
        astal.astal4
        # Add any extra Astal packages or GTK dependencies you need here
      ];

      # Ensure app.ts points to your entrypoint file
      installPhase = ''
        ags bundle app.ts $out/bin/ags-shell
      '';

      preFixup = ''
        gappsWrapperArgs+=(
          --prefix PATH : ${
          pkgs.lib.makeBinPath [
            # Add runtime executable dependencies here
          ]
        }
        )
      '';
    };

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
