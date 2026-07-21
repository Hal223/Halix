{
  pkgs,
  lib,
  config,
  ...
}: {
  # ---------------------------------------------------------------------------
  # Declarative dotfiles via GNU Stow
  #
  # Each host opts into specific stow "packages" (top-level dirs inside
  # ~/Dotfiles-halix).  After every nixos-rebuild switch the activation
  # script re-runs stow so symlinks stay current without any manual step.
  #
  # Usage in a host configuration.nix:
  #   hal.dotfiles.stowPackages = [ "hypr" "ags" ];
  # ---------------------------------------------------------------------------

  options.hal.dotfiles = {
    user = lib.mkOption {
      type = lib.types.str;
      default = "hal";
      description = "User whose home directory receives the stow symlinks.";
    };

    repoPath = lib.mkOption {
      type = lib.types.str;
      default = "/home/hal/Dotfiles-halix";
      description = "Absolute path to the dotfiles repository.";
    };

    stowPackages = lib.mkOption {
      type = lib.types.listOf lib.types.str;
      default = [];
      description = "Stow packages (top-level dirs in repoPath) to apply for this host.";
    };
  };

  config = lib.mkIf (config.hal.dotfiles.stowPackages != []) {
    environment.systemPackages = [pkgs.stow];

    # Runs as root during activation, but immediately drops to the target user
    # via `su` so all symlinks are owned by that user.
    system.activationScripts."dotfiles-stow" = lib.stringAfter ["users"] ''
      _DOTFILES="${config.hal.dotfiles.repoPath}"
      _USER="${config.hal.dotfiles.user}"
      _HOME="$(getent passwd "$_USER" | cut -d: -f6)"
      _PKGS="${lib.concatStringsSep " " config.hal.dotfiles.stowPackages}"

      if [ -d "$_DOTFILES" ]; then
        echo "dotfiles: stowing [$_PKGS] for $_USER"
        /bin/su -s ${pkgs.bash}/bin/bash "$_USER" -c \
          "${pkgs.stow}/bin/stow --dir=\"$_DOTFILES\" --target=\"$_HOME\" --restow $_PKGS" \
          && echo "dotfiles: stow complete" \
          || echo "dotfiles: stow had warnings (non-fatal)"
      else
        echo "dotfiles: $_DOTFILES not found — skipping (clone the repo and rebuild)"
      fi
    '';
  };
}
