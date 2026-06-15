{
  config,
  pkgs,
  ...
}: {
  # Enable Zsh system-wide so it picks up global environments and aliases
  programs.zsh = {
    enable = true;
    autosuggestions.enable = true;
    syntaxHighlighting.enable = true;

    ohMyZsh = {
      enable = true;
      theme = "robbyrussell"; # Try "agnoster" if you prefer a powerline-style prompt
      plugins = ["git" "sudo"];
    };
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
