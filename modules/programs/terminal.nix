{
  config,
  pkgs,
  ...
}: {
  programs.git = {
    enable = true;
    config = {
      user = {
        name = "Holden Prather";
        email = "jprather223@gmail.com";
      };
      init = {
        defaultBranch = "main";
      };
    };
  };

  environment.systemPackages = with pkgs; [
    # Terminal Emulators & Utilities
    ghostty
    superfile
    kitty
    zsh
    wget
    vim
    gh
    file
    bat
    tree
    nitch # neofetch alternative
    fresh-editor
    btop
    cowsay
  ];

  environment.shellAliases = {
    sudo = "sudo ";
    ll = "ls -l";
    l = "ls -alh";
    ls = "ls --color=tty";
    nnano = "/run/current-system/sw/bin/nano";
    nano = "/run/current-system/sw/bin/fresh";
    ccat = "/run/current-system/sw/bin/cat";
    cat = "bat";
    yy = "yazi";
    update = "~/Halix/scripts/rebuild.sh";
    upgrade = "sudo nix flake update --flake ~/Halix";
    cleanup-old-build = "~/Halix/scripts/cleanup-old-build.sh";
    gc-cleanup = "nix-collect-garbage --delete-older-than 7d";
    vscode = "code";
    ags-dev = "nix shell github:aylur/ags#agsFull";
  };

  programs.bash = {
    interactiveShellInit = ''
      /run/current-system/sw/bin/nitch

      # Apply Pywal colors to new terminal instances
      [ -f ~/.cache/wal/sequences ] && cat ~/.cache/wal/sequences
    '';
  };
}
