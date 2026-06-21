{
  pkgs,
  inputs,
  lib,
  ...
}: {
  imports = [
    ./yazi.nix
    ./sway.nix
    ./waybar.nix
    ./steam.nix
    ./mulvad-vpn.nix
    ./terminal.nix
  ];

  # Install firefox.
  programs.firefox = {
    enable = true;
    nativeMessagingHosts.packages = [
      (pkgs.runCommand "pywalfox-manifest" {} ''
        mkdir -p $out/lib/mozilla/native-messaging-hosts
        cat > $out/lib/mozilla/native-messaging-hosts/pywalfox.json <<EOF
        {
          "name": "pywalfox",
          "description": "Pywalfox native messaging daemon",
          "path": "${pkgs.writeShellScript "pywalfox-daemon" ''
          exec ${pkgs.pywalfox-native}/bin/pywalfox start "$@"
        ''}",
          "type": "stdio",
          "allowed_extensions": [ "pywalfox@frewacom.org" ]
        }
        EOF
      '')
    ];
  };
  virtualisation.docker.enable = true;
  # 3. Enable Syncthing as a system service (Best Practice)
  services.syncthing = {
    enable = true;
    user = "hal";
    dataDir = "/home/hal/Sync";
    configDir = "/home/hal/.config/syncthing";
  };

  services.ollama = {
    enable = true;
    #acceleration = pkgs.ollama-rocm
    package = inputs.nixpkgs-master.legacyPackages.${pkgs.stdenv.hostPlatform.system}.ollama-rocm;
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
    pywalfox-native
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

    # --- Development & System Tools ---
    lmstudio
    vscode
    google-antigravity
    google-antigravity-ide
    antigravity-cli
    nodejs_24
    python315
    sshfs
    fuse3 # SSH file system support
    nixfmt # nix file formatter
    pywal16
    swaybg
    grim
    slurp
    wl-clipboard
    alejandra # nix formatter
    mako

    go
    gopls
    gotools
    gcc
    inputs.fresh.packages.${pkgs.stdenv.hostPlatform.system}.default
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

  # Allow unfree software (required for Steam, Discord, Spotify)
  nixpkgs.config.allowUnfree = true;
}
