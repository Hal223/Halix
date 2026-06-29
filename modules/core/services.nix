{
  config,
  pkgs,
  ...
}: {
  services.fwupd.enable = true;

  # stay on on lid close
  services.logind.settings.Login.HandleLidSwitchExternalPower = "ignore";

  # Enable CUPS to print documents.
  services.printing.enable = true;

  services.libinput.enable = true;
}
