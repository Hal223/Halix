{
  config,
  pkgs,
  inputs,
  ...
}: {
  environment.systemPackages = with pkgs; [
    vscode
    antigravity
    nodejs_24
    python315
    go
    gopls
    gotools
    gcc
    inputs.fresh.packages.${pkgs.stdenv.hostPlatform.system}.default
  ];
}
