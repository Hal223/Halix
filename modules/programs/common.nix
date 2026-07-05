{
  config,
  pkgs,
  ...
}: {
  environment.systemPackages = with pkgs; [
    # Utilities
    obsidian
    keepassxc
    google-chrome
    chromium
    sshfs
    fuse3
    nixfmt
    alejandra

    # Sound & Desktop (CLI/base tools)
    pwvucontrol
    pywal16
    swaybg
    grim
    slurp
    wl-clipboard
    mako
    wofi

    # Networking
    nmap
    wireshark
    tcpdump
    dig
    netcat
    qbittorrent
    net-tools
    ethtool

    # System Utilities
    popsicle
    pciutils
    usbutils
    smartmontools
  ];
}
