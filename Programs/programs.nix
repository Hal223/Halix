{
  pkgs,
  inputs,
  ...
}: {
  imports = [
    ./yazi.nix
    ./sway.nix
    ./steam.nix
    # ./mulvad-vpn.nix
  ];

  # Install firefox.
  programs.firefox.enable = true;

  # 3. Enable Syncthing as a system service (Best Practice)
  services.syncthing = {
    enable = true;
    user = "hal";
    dataDir = "/home/hal/Sync";
    configDir = "/home/hal/.config/syncthing";
  };

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

  services.gnome.gnome-keyring.enable = true;
  programs.seahorse.enable = true;

  environment.variables = {
    SSH_ASKPASS = "${pkgs.seahorse}/libexec/seahorse/ssh-askpass";
    SSH_ASKPASS_REQUIRE = "force";
  };

  # Some programs need SUID wrappers, can be configured further or are
  # started in user sessions.
  # programs.mtr.enable = true;
  # programs.gnupg.agent = {
  #   enable = true;
  #   enableSSHSupport = true;
  # };

  # 4. Global Packages
  environment.systemPackages = with pkgs; [
    # --- Desktop & Productivity ---
    firefox
    discord
    vesktop
    slurp
    obsidian
    keepassxc
    ags
    google-chrome
    chromium

    # --- Media & Editing ---
    spotify
    audacity
    vlc
    syncthing
    feh

    # --- Terminal & Development ---
    wget
    vim
    ghostty
    lmstudio
    zsh
    cowsay
    kitty
    vscode
    nodejs_24
    python315
    gh
    sshfs
    fuse3 # SSH file system support
    file
    bat
    tree
    nitch # nefetch
    nixfmt # nix file formatter
    pywal16
    swaybg
    grim
    slurp
    wl-clipboard
    alejandra # nix formatter
    mako
    swaybg

    go
    gopls
    gotools
    gcc
    inputs.fresh.packages.${pkgs.stdenv.hostPlatform.system}.default
    btop
    wofi
    # Sound
    pwvucontrol

    # Networking
    nmap
    wireshark
    tcpdump
    dig
    netcat
    qbittorrent
    net-tools
    ethtool
    popsicle # lsbl ---- then ---- sudo popsicle ~/Downloads/pop-os_24.04_amd64_nvidia_23.iso /dev/sdc
    # --- System Utilities (Recommended for your multi-drive setup) ---
    pciutils # For 'lspci' to identify NVME controllers
    usbutils # For 'lsusb'
    smartmontools # To monitor the health of your NVME, SSD, and HDD
  ];
  virtualisation.virtualbox.host.enable = true;

  # Allow unfree software (required for Steam, Discord, Spotify)
  nixpkgs.config.allowUnfree = true;
}
