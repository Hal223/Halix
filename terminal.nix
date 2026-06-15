{
  config,
  pkgs,
  ...
}: {
  # Create the config file in /etc
  programs.ghostty.settings = {
    command = "/run/current-system/sw/bin/bash"; # Replace with your preferred shell path
  };
  environment.shellAliases = {
    sudo = "sudo ";
    ll = "ls -l";
    l = "ls -alh";
    ls = "ls --color=tty";
    nnano = "/run/current-system/sw/bin/nano";
    nano = "fresh";
    ccat = "/run/current-system/sw/bin/cat";
    cat = "bat";
    yy = "yazi";
    update = "~/Halix/Programs/rebuild.sh";
    gc-cleanup = "nix-collect-garbage --delete-older-than 7d";
    vscode = "code";
  };
}
