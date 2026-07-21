{
  config,
  pkgs,
  inputs,
  ...
}: {
  # Fix vscode error
  programs.direnv.enable = true;

  environment.systemPackages = with pkgs; [
    vscode
    antigravity
    nodejs_24
    python315
    go
    gopls
    gotools
    gcc
    # fresh removed: flake packaging broken on 0.4.x (web-ui assets missing from Nix build sandbox)
    # Re-add when upstream fixes: github.com/sinelaw/fresh
  ];
}
