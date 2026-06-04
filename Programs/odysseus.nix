{
  config,
  pkgs,
  lib,
  ...
}: let
  cfg = config.services.odysseus;
in {
  options.services.odysseus = {
    enable = lib.mkEnableOption "Odysseus AI Workspace";

    dataDir = lib.mkOption {
      type = lib.types.str;
      default = "/var/lib/odysseus";
      description = "Directory for Odysseus installation and data state.";
    };

    host = lib.mkOption {
      type = lib.types.str;
      default = "127.0.0.1";
      description = "Host IP to bind the web interface.";
    };

    port = lib.mkOption {
      type = lib.types.port;
      default = 7000;
      description = "Port to bind the web interface.";
    };
  };

  config = lib.mkIf cfg.enable {
    systemd.services.odysseus = {
      description = "Odysseus AI Workspace";
      wantedBy = ["multi-user.target"];
      after = ["network.target"];

      # Includes python311, git, and tmux (required by Odysseus Cookbook)
      path = with pkgs; [git python311 tmux stdenv.cc.cc.lib zlib glib];

      script = ''
        mkdir -p ${cfg.dataDir}
        cd ${cfg.dataDir}

        # Clone or update the repository
        if [ ! -d "repo" ]; then
          git clone https://github.com/pewdiepie-archdaemon/odysseus.git repo
        else
          cd repo
          git pull
          cd ..
        fi

        cd repo

        # Create virtual environment if missing
        if [ ! -d "venv" ]; then
          python3 -m venv venv
        fi

        source venv/bin/activate

        # Install Python dependencies dynamically
        pip install -r requirements.txt

        # Run Odysseus initial setup
        python setup.py

        # Start the application
        exec python -m uvicorn app:app --host ${cfg.host} --port ${cfg.port}
      '';

      serviceConfig = {
        Type = "simple";
        Restart = "on-failure";
        WorkingDirectory = "${cfg.dataDir}/repo";
        # Injects standard libraries so pre-compiled PyPI binaries (e.g., fastembed) resolve correctly on NixOS
        Environment = "LD_LIBRARY_PATH=${lib.makeLibraryPath [pkgs.stdenv.cc.cc.lib pkgs.zlib pkgs.glib]}:$LD_LIBRARY_PATH";
      };
    };
  };
}
