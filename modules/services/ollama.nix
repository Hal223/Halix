{
  config,
  pkgs,
  inputs,
  ...
}: {
  services.ollama = {
    enable = true;
    package = pkgs.ollama-rocm;
  };
}
