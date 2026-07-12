# AGS Theme Manager

The Theme Manager provides a visual interface for managing system wallpapers and color schemes. It integrates with `awww` (a wallpaper daemon) and `pywal` (a color palette generator). Users can select random wallpapers, pick local images, save their current active theme, and organize/delete their saved themes via a drag-and-drop grid. Instead of using complex GTK models (`Gio.ListStore` + `Gtk.GridView`), it uses a straightforward `Gtk.FlowBox`. Whenever the underlying data (saved themes) changes, the grid is cleared and repopulated. This approach avoids complexities with GTK recycling list items and simplifies drag-and-drop state management.

### Key Components

1. Storage (`loadThemes` / `persistThemes`)
   - Themes are stored as JSON in `~/.config/ags-themes/saved.json`.
   - Each theme contains a unique UUID, a name, a wallpaper path, and a timestamp.

2. The Grid (`Gtk.FlowBox`)
   - A `Gtk.FlowBox` serves as the container for all items.
   - It is configured to maintain exactly 3 columns (`max_children_per_line = 3`, `min_children_per_line = 3`).
   - The grid always starts with three permanent "Action Cells" (Dice, Save, Pick file), followed by either a placeholder (if no themes exist) or the dynamically generated saved theme cells.

3. Action Cells
   - Dice (🎲): Scans `~/Pictures/Wallpapers` for images and applies a random one.
   - Save (💾): Reads active wallpaper from `~/.cache/wal/wal`, creates a new `SavedTheme` entry.
   - Pick (🗂️): Opens a native `Gtk.FileDialog` allowing the user to manually browse and select a local image.

## Theme Tile Structure

Each saved theme is rendered as a complex nested GTK layout wrapped inside a single source-of-truth CSS box (`.theme-grid-cell`).

```text
Gtk.Box (.theme-grid-cell)  <-- DropTarget attached here
 └── Gtk.Overlay (.theme-thumbnail-container)
      ├── Gtk.Picture (Main child, shows the wallpaper)
      ├── Gtk.Box (.theme-thumbnail-overlay)
      │    └── Gtk.Box (.actions)
      │         ├── Gtk.Box (.overlay-half .left)  [ ✓ Apply ]
      │         └── Gtk.Box (.overlay-half .right) [ ✕ Delete ]
      └── Gtk.Box (.theme-drag-handle)             [ Drag Handle ]
```

### Drag & Drop Implementation

The drag-and-drop system relies on GTK4's native Event Controllers:

- Drag Source (`Gtk.DragSource`): Attached to a thin, absolute-positioned pill at the top of the thumbnail (`.theme-drag-handle`). When dragged, it provides the theme's UUID as a string.
- Drop Target (`Gtk.DropTarget`): Attached to the outermost container of the tile (`.theme-grid-cell`). It accepts string data.
- Reordering: When a drop is completed, the code finds the index of the dragged UUID and the target UUID, mutates the array of themes in memory, persists the new array to disk, and completely rebuilds the grid (`refreshGrid()`).

### Image Fallbacks & Rendering

The widget uses `Gtk.Picture` for rendering thumbnails. This widget is specifically designed to maintain aspect ratios while filling its container (`content_fit: COVER`). If an image path is invalid or the image gets deleted from the filesystem, `makeThumbnailImage` catches the error and safely falls back to a generic `🖼` icon label to prevent the widget from crashing.

## Lifecycle and UI Updates

The `refreshGrid()` function is the heart of the UI lifecycle:
1. It loops through and destroys all current children in the `Gtk.FlowBox`.
2. It re-inserts the static action tiles.
3. It loads the latest state from disk.
4. It iterates over the themes, constructing a new DOM node for each, and appends them to the grid.

Because all state is flushed and rebuilt on disk events, the UI guarantees it will never get out of sync with `saved.json`.
