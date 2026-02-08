#!/run/current-system/sw/bin/bash
set -e
pushd ~/Halix/

# 1. Format and Stage
alejandra . &>/dev/null
git add .

# 2. Show diff
git diff --staged -U0

# 3. Rebuild
echo "NixOS Rebuilding..."
sudo nixos-rebuild switch --flake .# &>nixos-switch.log || {
    echo "Build had issues, checking logs..."
    grep --color error nixos-switch.log || true
}

# 4. Get the unique Build Name (Store Path)
# This looks for the "The new configuration is..." line in your log
build_name=$(grep "The new configuration is" nixos-switch.log | awk '{print $NF}' || echo "unknown-build")
# Get the generation number as a fallback/extra info
gen=$(sudo nixos-rebuild list-generations | grep current | awk '{print $1}' || echo "current")

# 5. Commit with Unique Build Name
# Example: "Build: 142 - /nix/store/...-nixos-system-halix-..."
if git commit -m "Build: $gen - $build_name"; then
    echo "Commit successful: $build_name"
else
    echo "No changes to commit."
fi

popd