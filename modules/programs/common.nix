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
    pwvucontrol
    pywal16
    awww
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
    qdirstat
    vulnix
  ];
  systemd.user.services.awww-daemon = {
    description = "Awww Wallpaper Daemon";
    wantedBy = ["graphical-session.target"];
    partOf = ["graphical-session.target"];
    environment = {
      WAYLAND_DISPLAY = "wayland-1";
      XDG_RUNTIME_DIR = "/run/user/1000";
    };
    serviceConfig = {
      ExecStart = "${pkgs.awww}/bin/awww-daemon";
      Restart = "on-failure";
    };
  };
}
