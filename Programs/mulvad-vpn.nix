{
  pkgs,
  inputs,
  ...
}: {
  # VPN solution moving away from PIA as hassle to config in nix 2026-01-17
  services.mullvad-vpn.enable = true;
  services.mullvad-vpn.package = pkgs.mullvad-vpn;
}
