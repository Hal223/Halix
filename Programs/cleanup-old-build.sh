#!/run/current-system/sw/bin/bash
set -e

echo "Cleaning up NixOS system generations older than 30 days..."

# Remove old generations and run garbage collection as root for the system profile
sudo nix-collect-garbage --delete-older-than 30d

# Update the bootloader menu to reflect the deleted generations
echo "Updating bootloader..."
sudo nixos-rebuild boot

echo "Cleanup complete!"