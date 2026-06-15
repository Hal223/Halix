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
    kitty
    zsh
    wget
    vim
    gh
    file
    bat
    tree
    nitch # neofetch alternative
    btop
    cowsay
  ];

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

  programs.bash = {
    interactiveShellInit = ''
      ${pkgs.neofetch}/bin/nitch
    '';
  };
}
