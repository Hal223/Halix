#!/usr/bin/env bash
# =============================================================================
# setup-dotfiles.sh
# Initializes ~/Dotfiles-halix from the staged files in Halix/scripts/dotfiles-stage/
# Run once manually after the initial nixos-rebuild.
# =============================================================================
set -euo pipefail

DOTFILES_DIR="$HOME/Dotfiles-halix"
STAGE_DIR="$(dirname "$0")/dotfiles-stage"
HALIX_AGS="$HOME/Halix/modules/desktop/ags"

echo "==> Creating $DOTFILES_DIR structure..."
mkdir -p \
  "$DOTFILES_DIR/hypr/.config/hypr" \
  "$DOTFILES_DIR/ags/.config/ags/widget" \
  "$DOTFILES_DIR/ags/.config/ags/lib"

echo "==> Copying hyprland config..."
cp "$STAGE_DIR/hypr/.config/hypr/hyprland.conf" \
   "$DOTFILES_DIR/hypr/.config/hypr/hyprland.conf"

echo "==> Copying AGS config from Halix (source of truth for now)..."
# Root config files
for f in app.ts style.scss tsconfig.json package.json env.d.ts; do
  cp "$HALIX_AGS/$f" "$DOTFILES_DIR/ags/.config/ags/"
done

# Widget files
cp "$HALIX_AGS/widget/"*.tsx "$DOTFILES_DIR/ags/.config/ags/widget/"
# Copy any docs
cp "$HALIX_AGS/widget/"*.md "$DOTFILES_DIR/ags/.config/ags/widget/" 2>/dev/null || true

# Lib files
cp "$HALIX_AGS/lib/"*.ts "$DOTFILES_DIR/ags/.config/ags/lib/"

echo "==> Copying .gitignore for AGS..."
cat > "$DOTFILES_DIR/ags/.config/ags/.gitignore" <<'EOF'
node_modules/
@girs/
EOF

echo "==> Writing top-level .gitignore..."
cat > "$DOTFILES_DIR/.gitignore" <<'EOF'
# Stow metadata
.stow-local-ignore

# OS
.DS_Store
Thumbs.db
EOF

echo "==> Writing README..."
cat > "$DOTFILES_DIR/README.md" <<'EOF'
# Dotfiles-halix

Personal dotfiles managed with [GNU Stow](https://www.gnu.org/software/stow/).
Symlinks are applied automatically during `nixos-rebuild switch` via the
`hal.dotfiles.stowPackages` NixOS option defined in
`~/Halix/modules/core/dotfiles.nix`.

## Structure

```
Dotfiles-halix/
├── hypr/.config/hypr/hyprland.conf   → ~/.config/hypr/hyprland.conf
└── ags/.config/ags/                  → ~/.config/ags/
```

## Manual stow

```bash
stow --dir=~/Dotfiles-halix --target=~ --restow hypr ags
```

## Adding a new package

1. Create `<package>/.config/<app>/` inside this repo
2. Add `"<package>"` to `hal.dotfiles.stowPackages` in the host's `configuration.nix`
3. Run `nixos-rebuild switch` — stow runs automatically
EOF

echo "==> Initialising git repo..."
if [ ! -d "$DOTFILES_DIR/.git" ]; then
  git -C "$DOTFILES_DIR" init
  git -C "$DOTFILES_DIR" add -A
  git -C "$DOTFILES_DIR" commit -m "chore: initial dotfiles from Halix migration"
  echo "    Git repo initialised with first commit."
else
  echo "    Git repo already exists — skipping init."
fi

echo ""
echo "✓ Dotfiles repo ready at $DOTFILES_DIR"
echo ""
echo "Next steps:"
echo "  1. Run your rebuild:  ~/Halix/scripts/rebuild.sh"
echo "     (stow will run automatically during activation)"
echo "  2. Verify symlinks:   ls -la ~/.config/hypr ~/.config/ags"
echo "  3. Push dotfiles:     cd ~/Dotfiles-halix && git remote add origin <url> && git push -u origin main"
