# Edit this configuration file to define what should be installed on
# your system.  Help is available in the configuration.nix(5) man page
# and in the NixOS manual (accessible by running ‘nixos-help’).
{
  config,
  pkgs,
  ...
}: {
  imports = [
    ./hardware-configuration.nix
    ./display.nix
    ./Programs/programs.nix # We will put your apps here
  ];

  nix.settings.experimental-features = [
    "nix-command"
    "flakes"
  ];
  system.stateVersion = "25.11";

  # Bootloader.
  boot.loader.systemd-boot.enable = true;
  boot.loader.efi.canTouchEfiVariables = true;

  networking.hostName = "halix";

  # Define a user account. Don't forget to set a password with ‘passwd’.
  users.users.hal = {
    isNormalUser = true;
    description = "Hal";
    extraGroups = [
      "networkmanager"
      "wheel"
      "networkmanager"
      "video"
      "audio"
    ];
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

  fonts.packages = with pkgs; [
    nerd-fonts.fira-code
    vista-fonts
  ];

  # Enable networking
  networking.networkmanager.enable = true;

  # Set your time zone.
  time.timeZone = "America/Denver";

  # Enable the X11 windowing system.
  services.xserver.enable = true;
  services.fwupd.enable = true;

  # stay on on lid close
  services.logind.settings.Login.HandleLidSwitchExternalPower = "ignore";
  # Configure keymap in X11
  services.xserver.xkb = {
    layout = "us";
    variant = "";
  };

  # Enable CUPS to print documents.
  services.printing.enable = true;

  # Enable sound with pipewire.
  services.pulseaudio.enable = false;
  security.rtkit.enable = true;
  services.pipewire = {
    enable = true;
    alsa.enable = true;
    alsa.support32Bit = true;
    pulse.enable = true;
    # If you want to use JACK applications, uncomment this
    #jack.enable = true;

    # use the example session manager (no others are packaged yet so this is enabled by default,
    # no need to redefine it in your config for now)
    #media-session.enable = true;
  };
  xdg.portal = {
    enable = true;
    wlr.enable = true; # Required for wlroots-based compositors like Sway
    extraPortals = [pkgs.xdg-desktop-portal-gtk];
    config.common.default = [
      "wlr"
      "gtk"
    ];
  };
  environment.sessionVariables = {
    NIXOS_OZONE_WL = "1"; # Tells Electron apps (like Discord) to use Wayland
    XDG_CURRENT_DESKTOP = "sway"; # Helps portals identify the environment
  };
  services.libinput.enable = true;
  # Enable the OpenSSH daemon.
  # services.openssh.enable = true;
  # Select internationalisation properties.
  i18n.defaultLocale = "en_US.UTF-8";
  i18n.extraLocaleSettings = {
    LC_ADDRESS = "en_US.UTF-8";
    LC_IDENTIFICATION = "en_US.UTF-8";
    LC_MEASUREMENT = "en_US.UTF-8";
    LC_MONETARY = "en_US.UTF-8";
    LC_NAME = "en_US.UTF-8";
    LC_NUMERIC = "en_US.UTF-8";
    LC_PAPER = "en_US.UTF-8";
    LC_TELEPHONE = "en_US.UTF-8";
    LC_TIME = "en_US.UTF-8";
  };
}
