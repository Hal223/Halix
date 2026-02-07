{ pkgs, inputs,... }:
{
  programs.yazi = {
    enable = true;

    # 1. Install the plugin
    plugins = {
      smart-enter = "${inputs.yazi-plugins}/smart-enter.yazi";
    };
    settings.yazi = {
      open = {
        prepend_rules = [
          { url = "*.mp4"; use = [ "vlc" "play" "reveal" ]; }
        ];
      };
      opener = {
        vlc = [
          { 
            run = ''vlc "$@" ''; 
            orphan = true; 
            for = "unix"; 
            desc = "vlc";
          }
        ];
      };
    };
    # 2. Configure the keybind to use the plugin
    settings = {
      keymap = {
        manager = {
          prepend_keymap = [
            {
              on = [ "o" ];
              run = "plugin --sync smart-enter";
              desc = "CD into directory";
            }
          ];
        };
      };
    };
  };
}
