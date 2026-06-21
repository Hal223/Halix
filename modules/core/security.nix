{
  config,
  pkgs,
  ...
}: {
  services.gnome.gnome-keyring.enable = true;
  programs.seahorse.enable = true;

  environment.variables = {
    SSH_ASKPASS = "${pkgs.seahorse}/libexec/seahorse/ssh-askpass";
    SSH_ASKPASS_REQUIRE = "force";
  };
}
