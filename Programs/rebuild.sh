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

# 4. Get generation info (requires sudo)
# Added '|| echo "Unknown"' so gen is never empty
gen=$(sudo nixos-rebuild list-generations | grep current || echo "Unknown Generation")

# 5. Commit and Push
# We use -a to ensure all changes are grabbed, though git add . already did this
if git commit -m "Rebuild: $gen"; then
    echo "Pushing to Git remote..."
    git push
else
    echo "No changes to commit, or commit failed."
fi

popd