import app from "ags/gtk4/app"
import { Astal, Gtk, Gdk } from "ags/gtk4"
import GLib from "gi://GLib"
import Gio from "gi://Gio"
import GdkPixbuf from "gi://GdkPixbuf"

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────
interface SavedTheme {
  id: string
  name: string
  wallpaperPath: string
  savedAt: number
}

// ──────────────────────────────────────────────────────────────────────────────
// Storage helpers
// ──────────────────────────────────────────────────────────────────────────────
const THEMES_DIR = GLib.get_home_dir() + "/.config/ags-themes"
const THEMES_FILE = THEMES_DIR + "/saved.json"

function ensureDir() {
  const gdir = Gio.File.new_for_path(THEMES_DIR)
  if (!gdir.query_exists(null)) gdir.make_directory_with_parents(null)
}

function loadThemes(): SavedTheme[] {
  try {
    const file = Gio.File.new_for_path(THEMES_FILE)
    if (!file.query_exists(null)) return []
    const [, contents] = file.load_contents(null)
    return JSON.parse(new TextDecoder().decode(contents)) as SavedTheme[]
  } catch {
    return []
  }
}

function persistThemes(themes: SavedTheme[]) {
  try {
    ensureDir()
    const json = JSON.stringify(themes, null, 2)
    // GLib.file_set_contents is the most reliable sync write in GJS
    GLib.file_set_contents(THEMES_FILE, json)
  } catch (e) {
    console.error("persistThemes failed:", e)
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Shell helpers
// ──────────────────────────────────────────────────────────────────────────────
function spawnAsync(cmd: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const proc = Gio.Subprocess.new(
        cmd,
        Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
      )
      proc.communicate_utf8_async(null, null, (p, res) => {
        try {
          const [, stdout, stderr] = p!.communicate_utf8_finish(res)
          if (p!.get_successful()) resolve(stdout?.trim() ?? "")
          else reject(stderr?.trim() ?? "command failed")
        } catch (e) { reject(e) }
      })
    } catch (e) { reject(e) }
  })
}

// ──────────────────────────────────────────────────────────────────────────────
// Wallpaper / pywal helpers
// ──────────────────────────────────────────────────────────────────────────────
function getWallpaperFiles(): string[] {
  const wallDir = GLib.get_home_dir() + "/Pictures/Wallpapers"
  const dir = Gio.File.new_for_path(wallDir)
  if (!dir.query_exists(null)) return []
  const enumerator = dir.enumerate_children(
    "standard::name,standard::type",
    Gio.FileQueryInfoFlags.NONE,
    null
  )
  const exts = [".jpg", ".jpeg", ".png", ".webp", ".gif"]
  const files: string[] = []
  let info: Gio.FileInfo | null
  while ((info = enumerator.next_file(null)) !== null) {
    const name = info.get_name()
    if (exts.some(e => name.toLowerCase().endsWith(e))) {
      files.push(wallDir + "/" + name)
    }
  }
  return files
}

async function applyWallpaper(wallPath: string) {
  // 1. Set wallpaper visually via swww (standard Hyprland wallpaper daemon)
  await spawnAsync(["swww", "img", wallPath, "--transition-type", "fade", "--transition-duration", "0.8"]).catch((e) => {
    console.error("swww failed:", e)
  })
  // 2. Generate pywal colors only (-n skips wallpaper so swww handles it)
  await spawnAsync(["wal", "-i", wallPath, "-n"]).catch((e) => {
    console.error("wal failed:", e)
  })
}

async function getCurrentWallpaperPath(): Promise<string> {
  try {
    const walFile = GLib.get_home_dir() + "/.cache/wal/wal"
    const [ok, contents] = GLib.file_get_contents(walFile)
    if (!ok) return ""
    return new TextDecoder().decode(contents).trim()
  } catch (e) {
    console.error("getCurrentWallpaperPath failed:", e)
    return ""
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Thumbnail image helper
// ──────────────────────────────────────────────────────────────────────────────
function makeThumbnailImage(wallPath: string): Gtk.Widget {
  try {
    const pbuf = GdkPixbuf.Pixbuf.new_from_file_at_scale(wallPath, 140, 90, false)
    const img = new Gtk.Image({ css_classes: ["thumb-image"] })
    img.set_from_pixbuf(pbuf)
    return img
  } catch {
    const lbl = new Gtk.Label({ label: "🖼", css_classes: ["thumb-fallback"] })
    lbl.set_halign(Gtk.Align.CENTER)
    lbl.set_valign(Gtk.Align.CENTER)
    return lbl
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// ThemeManager popup window
// ──────────────────────────────────────────────────────────────────────────────
export default function ThemeManager(gdkmonitor: Gdk.Monitor, id: number = 0) {
  const { TOP, RIGHT } = Astal.WindowAnchor
  let busy = false

  // ── Status label ─────────────────────────────────────────────────────────
  const statusLabel = new Gtk.Label({
    label: "",
    css_classes: ["status-label"],
    halign: Gtk.Align.CENTER,
    hexpand: true,
  })

  function setStatus(msg: string, ms = 2800) {
    statusLabel.set_label(msg)
    GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => {
      statusLabel.set_label("")
      return GLib.SOURCE_REMOVE
    })
  }

  // ── Saved themes grid ─────────────────────────────────────────────────────
  const grid = new Gtk.FlowBox({
    row_spacing: 10,
    column_spacing: 10,
    max_children_per_line: 2,
    min_children_per_line: 2,
    selection_mode: Gtk.SelectionMode.NONE,
    css_classes: ["themes-grid"],
  })
  grid.set_homogeneous(true)

  function clearGrid() {
    let child = grid.get_first_child()
    while (child) {
      const next = child.get_next_sibling()
      grid.remove(child)
      child = next
    }
  }

  function buildThemeTile(theme: SavedTheme): Gtk.Widget {
    const img = makeThumbnailImage(theme.wallpaperPath)
    img.set_hexpand(true)
    img.set_vexpand(true)

    const nameLabel = new Gtk.Label({
      label: theme.name.length > 20 ? theme.name.substring(0, 18) + "…" : theme.name,
      css_classes: ["thumb-name"],
      halign: Gtk.Align.CENTER,
      valign: Gtk.Align.CENTER,
      hexpand: true,
      wrap: true,
      justify: Gtk.Justification.CENTER,
    })
    const overlay_box = new Gtk.Box({
      css_classes: ["theme-thumbnail-overlay"],
      halign: Gtk.Align.FILL,
      valign: Gtk.Align.FILL,
    })
    overlay_box.append(nameLabel)

    const overlay = new Gtk.Overlay()
    overlay.set_css_classes(["theme-thumbnail-container"])
    overlay.set_child(img)
    overlay.add_overlay(overlay_box)

    const selectBtn = new Gtk.Button({ css_classes: ["select-btn"], hexpand: true })
    selectBtn.set_child(new Gtk.Label({ label: "✓ Use" }))
    selectBtn.connect("clicked", async () => {
      if (busy) return
      busy = true
      setStatus("🎨 Applying theme…")
      closeWindow()
      await applyWallpaper(theme.wallpaperPath)
      busy = false
    })

    const deleteBtn = new Gtk.Button({ css_classes: ["delete-btn"] })
    deleteBtn.set_child(new Gtk.Label({ label: "✕" }))
    deleteBtn.connect("clicked", () => {
      let themes = loadThemes().filter(t => t.id !== theme.id)
      persistThemes(themes)
      refreshGrid()
    })

    const actions = new Gtk.Box({ spacing: 6, halign: Gtk.Align.FILL, hexpand: true })
    actions.append(selectBtn)
    actions.append(deleteBtn)

    const tile = new Gtk.Box({
      orientation: Gtk.Orientation.VERTICAL,
      spacing: 5,
      css_classes: ["theme-thumbnail-entry"],
    })
    tile.append(overlay)
    tile.append(actions)

    return tile
  }

  function refreshGrid() {
    clearGrid()
    const themes = loadThemes()
    if (themes.length === 0) {
      const empty = new Gtk.Label({
        label: "No saved themes yet.\nApply a wallpaper first,\nthen click 💾 to save.",
        justify: Gtk.Justification.CENTER,
        css_classes: ["empty-label"],
        hexpand: true,
      })
      grid.insert(empty, -1)
    } else {
      for (const theme of themes) {
        grid.insert(buildThemeTile(theme), -1)
      }
    }
  }

  // ── Dice button ───────────────────────────────────────────────────────────
  const diceIcon = new Gtk.Label({ label: "🎲", css_classes: ["icon"] })
  const diceLbl = new Gtk.Label({ label: "Random" })
  const diceInner = new Gtk.Box({
    orientation: Gtk.Orientation.VERTICAL,
    spacing: 6,
    halign: Gtk.Align.CENTER,
    valign: Gtk.Align.CENTER,
    hexpand: true,
    vexpand: true,
  })
  diceInner.append(diceIcon)
  diceInner.append(diceLbl)

  const diceBtn = new Gtk.Button({ css_classes: ["theme-tile", "dice-tile"], hexpand: true })
  diceBtn.set_child(diceInner)
  diceBtn.connect("clicked", async () => {
    if (busy) return
    busy = true
    setStatus("🎲 Picking random wallpaper…")
    try {
      const files = getWallpaperFiles()
      if (files.length === 0) { setStatus("❌ No wallpapers found!"); busy = false; return }
      const wall = files[Math.floor(Math.random() * files.length)]
      await applyWallpaper(wall)
      setStatus("✅ Applied!")
    } catch (e) {
      setStatus("❌ " + String(e).slice(0, 60))
    }
    busy = false
  })

  // ── Save button ────────────────────────────────────────────────────────────
  const saveIcon = new Gtk.Label({ label: "💾", css_classes: ["icon"] })
  const saveLbl = new Gtk.Label({ label: "Save" })
  const saveInner = new Gtk.Box({
    orientation: Gtk.Orientation.VERTICAL,
    spacing: 6,
    halign: Gtk.Align.CENTER,
    valign: Gtk.Align.CENTER,
    hexpand: true,
    vexpand: true,
  })
  saveInner.append(saveIcon)
  saveInner.append(saveLbl)

  const saveBtn = new Gtk.Button({ css_classes: ["theme-tile", "save-tile"], hexpand: true })
  saveBtn.set_child(saveInner)
  saveBtn.connect("clicked", async () => {
    if (busy) return
    busy = true
    setStatus("💾 Saving…")
    try {
      const wallPath = await getCurrentWallpaperPath()
      if (!wallPath) { setStatus("❌ No active pywal theme found"); busy = false; return }

      const existing = loadThemes()
      // Avoid duplicates
      if (existing.some(t => t.wallpaperPath === wallPath)) {
        setStatus("ℹ Already saved!")
        busy = false
        return
      }

      const name = wallPath.split("/").pop()?.replace(/\.[^.]+$/, "") ?? "theme"
      const newTheme: SavedTheme = {
        id: GLib.uuid_string_random(),
        name,
        wallpaperPath: wallPath,
        savedAt: Date.now(),
      }
      persistThemes([newTheme, ...existing])
      refreshGrid()
      setStatus("✅ Saved!")
    } catch (e) {
      setStatus("❌ " + String(e).slice(0, 60))
    }
    busy = false
  })

  // ── Top action row ─────────────────────────────────────────────────────────
  const topRow = new Gtk.Box({ spacing: 12, css_classes: ["top-actions"], hexpand: true, homogeneous: true })
  topRow.append(diceBtn)
  topRow.append(saveBtn)

  // ── Section label ──────────────────────────────────────────────────────────
  const sectionTitle = new Gtk.Label({
    label: "Saved Themes",
    css_classes: ["section-title"],
    halign: Gtk.Align.START,
    hexpand: true,
  })

  // ── Scrollable grid ────────────────────────────────────────────────────────
  const scroll = new Gtk.ScrolledWindow({
    css_classes: ["themes-scroll"],
    vexpand: false,
    hscrollbar_policy: Gtk.PolicyType.NEVER,
    vscrollbar_policy: Gtk.PolicyType.AUTOMATIC,
    propagate_natural_height: true,
    max_content_height: 380,
  })
  scroll.set_child(grid)

  // ── Content panel ──────────────────────────────────────────────────────────
  const content = new Gtk.Box({
    orientation: Gtk.Orientation.VERTICAL,
    css_classes: ["theme-manager-content"],
    spacing: 0,
  })
  content.append(topRow)
  content.append(statusLabel)
  content.append(sectionTitle)
  content.append(scroll)

  function closeWindow() {
    const win = app.get_window(`theme-manager-${id}`)
    if (win) win.visible = false
  }

  // ── Window ─────────────────────────────────────────────────────────────────
  return (
    <window
      name={`theme-manager-${id}`}
      class="ThemeManager"
      gdkmonitor={gdkmonitor}
      anchor={TOP | RIGHT}
      application={app}
      visible={false}
      keymode={Astal.Keymode.ON_DEMAND}
      onShow={() => refreshGrid()}
    >
      {content}
    </window>
  )
}
