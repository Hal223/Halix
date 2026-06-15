{
  config,
  pkgs,
  ...
}: {
  # Create the config file in /etc
  environment.etc."ghostty/config".text = ''
    command = ${pkgs.bash}/bin/bash
  '';

  # Force Ghostty to read the config by symlinking it to your home directory
  systemd.tmpfiles.rules = [
    "d /home/hal/.config/ghostty 0755 hal users - -"
    "L+ /home/hal/.config/ghostty/config - - - - /etc/ghostty/config"
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
}
