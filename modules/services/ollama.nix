{
  config,
  pkgs,
  inputs,
  ...
}: {
  services.ollama = {
    enable = true;
    package = inputs.nixpkgs-master.legacyPackages.${pkgs.stdenv.hostPlatform.system}.ollama-rocm;
  };
}
