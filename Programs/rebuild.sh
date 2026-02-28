#!/run/current-system/sw/bin/bash
set -e
pushd ~/Halix/

# 1. Format and Stage
# Alejandra handles formatting; git add ensures nixos-rebuild sees new files
alejandra . &>/dev/null
git add .

# 2. Show diff (Optional, but helpful to see what's changing)
git diff --staged -U0

# 3. Rebuild
echo "NixOS Rebuilding..."
# Using tee allows you to see the sudo prompt and build progress
if sudo nixos-rebuild switch --flake .# 2>&1 | tee nixos-switch.log; then
    
    # 4. Get the unique Build Name and Generation
    # It's more reliable to check the actual system link than to grep a log
    build_path=$(readlink /run/current-system)
    gen=$(nixos-rebuild list-generations | grep current | awk '{print $1}')

    # 5. Commit with Unique Build Name
    if git commit -m "Build: $gen - $build_path"; then
        echo "Successfully rebuilt and committed generation $gen."
    else
        echo "Build successful, but no changes were detected to commit."
    fi

else
    echo "--------------------------------------------------"
    echo "Build failed! Checking log for errors..."
    grep --color -i "error" nixos-switch.log || true
    exit 1
fi

popd