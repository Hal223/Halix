#!/run/current-system/sw/bin/bash
set -e
pushd ~/Halix/
# Alejandra is great for Flakes to ensure syntax consistency
alejandra . &>/dev/null
git add .
# 5. Show what is about to change
git diff --staged -U0
echo "NixOS Rebuilding..."
# 6. Run the rebuild using the local flake
# We use '#' to specify the default configuration in the flake
sudo nixos-rebuild switch --flake .# &>nixos-switch.log || (
    cat nixos-switch.log | grep --color error && exit 1
)

# 7. Get generation info for the commit message
gen=$(nixos-rebuild list-generations | grep current)

# 8. Commit the changes
git commit -m "Rebuild: $gen"

popd