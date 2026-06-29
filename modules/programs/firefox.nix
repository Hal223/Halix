{
  config,
  pkgs,
  ...
}: {
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

  environment.systemPackages = with pkgs; [
    pywalfox-native
  ];
}
