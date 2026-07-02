#!/run/current-system/sw/bin/bash
set -e

# Use redirection to silence pushd instead of -q for maximum compatibility
pushd /home/hal/Halix/ 
#> /dev/null 2>&1

# 1. Format and Stage
alejandra . 
#&>/dev/null
git add .

# 2. Show diff
git diff --staged -U0

# 3. Rebuild
echo "NixOS Rebuilding..."
# We use the absolute path ~/ to ensure the log is always in a predictable place
if sudo nixos-rebuild switch --flake .#$(hostname) 2>&1 | tee ~/nixos-switch.log; then

    # 4. Get the unique Build Name and Generation
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
    # We use ~/nixos-switch.log here to match the 'tee' command above
    grep --color -i "error" ~/nixos-switch.log || true
    exit 1
fi

popd > /dev/null 2>&1