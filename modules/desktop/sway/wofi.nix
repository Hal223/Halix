{pkgs, ...}: let
  wofiConfig = pkgs.writeText "wofi-config" ''
    width=500
    height=400
    location=center
    show=drun
    prompt=Search...
    filter_rate=100
    allow_markup=true
    allow_images=true
    insensitive=true
    hide_scroll=true
  '';

  wofiStyle = pkgs.writeText "wofi-style.css" ''
    @import url("file:///home/hal/.cache/wal/colors-waybar.css");

    * {
      font-family: "FiraCode Nerd Font", sans-serif;
      font-size: 14px;
    }

    window {
      background-color: alpha(@background, 0.85);
      color: @foreground;
      border: 2px solid @color2;
      border-radius: 12px;
      box-shadow: rgba(0, 0, 0, 0.2) 0px 2px 4px;
    }

    #outer-box {
      padding: 10px;
    }

    #input {
      margin-bottom: 10px;
      border: 1px solid alpha(@foreground, 0.2);
      border-radius: 8px;
      padding: 8px 12px;
      background-color: alpha(@color0, 0.5);
      color: @foreground;
    }

    #input:focus {
      border: 1px solid @color2;
    }

    #entry {
      padding: 6px 12px;
      border-radius: 8px;
    }

    #entry:selected {
      background-color: @color2;
      outline: none;
    }

    #entry:selected #text {
      color: @background;
    }

    #img {
      margin-right: 12px;
    }
  '';
in {
  config = wofiConfig;
  style = wofiStyle;
}
