import app from "ags/gtk4/app"
import { Astal, Gtk, Gdk } from "ags/gtk4"
import { execAsync, exec } from "ags/process"
import { createBinding as bind } from "ags"
import Hyprland from "gi://AstalHyprland"

interface Theme {
    name: string
    path: string
}

let currentGridBox: Gtk.Box | null = null;

const fetchThemes = async (gridBox = currentGridBox) => {
    if (!gridBox) return;
    try {
        const out = await execAsync(['sh', '-c', 'for f in ~/.config/halix-themes/*; do [ -e "$f" ] && echo "$(basename "$f")|$(cat "$f")"; done'])
        
        // Remove old children
        let child = gridBox.get_first_child()
        while (child) {
            const next = child.get_next_sibling()
            gridBox.remove(child)
            child = next
        }

        if (!out) return;

        const themes = out.split('\n').filter(Boolean).map(line => {
            const [name, path] = line.split('|')
            return { name, path }
        })
        
        let currentRow: Gtk.Box | null = null;

        // Add new themes in 2-column grid
        themes.forEach((theme, i) => {
            if (i % 2 === 0) {
                currentRow = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 10, homogeneous: true });
                gridBox.append(currentRow);
            }
            currentRow!.append(<ThemeThumbnail theme={theme} /> as Gtk.Widget)
        })
    } catch (err) {
        console.error(err)
    }
}

const applyTheme = async (path: string) => {
    try {
        // Save as current wallpaper for state tracking
        await execAsync(['sh', '-c', `echo "${path}" > /tmp/current_wallpaper`])
        
        // Generate pywal colors
        await execAsync(['wal', '-i', path, '-n', '-q']).catch(console.error)
        
        // Try to apply with awww
        await execAsync(['awww', 'img', path, '--transition-type', 'wave', '--transition-angle', '30', '--transition-step', '120', '--transition-duration', '0.8', '--transition-fps', '60', '--filter', 'Bilinear']).catch(console.error)
    } catch (err) {
        console.error("Failed to apply theme:", err)
    }
}

const selectRandomWallpaper = async () => {
    try {
        const wp = await execAsync(['sh', '-c', 'find ~/Pictures/Wallpapers -type f | shuf -n 1'])
        if (wp) {
            await applyTheme(wp.trim())
        }
    } catch (err) {
        console.error("Failed to pick random wallpaper:", err)
    }
}

const saveCurrentTheme = async () => {
    try {
        const currentPath = await execAsync(['cat', '/tmp/current_wallpaper'])
        if (!currentPath) return
        
        const path = currentPath.trim()
        const name = await execAsync(['basename', path])
        
        if (name && path) {
            await execAsync(['sh', '-c', `mkdir -p ~/.config/halix-themes && echo "${path}" > ~/.config/halix-themes/"${name.trim()}"`])
            await fetchThemes() // Refresh the list
        }
    } catch (err) {
        console.error("Failed to save theme:", err)
    }
}

const deleteTheme = async (name: string) => {
    try {
        await execAsync(['rm', '-f', `~/.config/halix-themes/${name}`])
        await fetchThemes()
    } catch (err) {
        console.error("Failed to delete theme:", err)
    }
}

function DiceTile() {
    return (
        <button cssName="theme-tile dice-tile" hexpand onClicked={selectRandomWallpaper}>
            <box orientation={Gtk.Orientation.VERTICAL} valign={Gtk.Align.CENTER}>
                <label label="" cssName="icon" />
                <label label="Dice" />
            </box>
        </button>
    )
}

function SaveTile() {
    return (
        <button cssName="theme-tile save-tile" hexpand onClicked={saveCurrentTheme}>
            <box orientation={Gtk.Orientation.VERTICAL} valign={Gtk.Align.CENTER}>
                <label label="" cssName="icon" />
                <label label="Save" />
            </box>
        </button>
    )
}

function ThemeThumbnail({ theme }: { theme: Theme }) {
    return (
        <box cssName="theme-thumbnail-container" widthRequest={160} heightRequest={100} css={`background-image: url('file://${theme.path}');`}>
            <box cssName="theme-thumbnail-overlay" hexpand vexpand valign={Gtk.Align.FILL} halign={Gtk.Align.FILL}>
                <box valign={Gtk.Align.CENTER} halign={Gtk.Align.CENTER} spacing={8}>
                    <button cssName="select-btn" onClicked={() => applyTheme(theme.path)}>
                        <label label="Select" />
                    </button>
                    <button cssName="delete-btn" onClicked={() => deleteTheme(theme.name)}>
                        <label label="Delete" />
                    </button>
                </box>
            </box>
        </box>
    )
}

export default function ThemeManager(gdkmonitor: Gdk.Monitor, id: number = 0) {
    const { TOP, BOTTOM, LEFT, RIGHT } = Astal.WindowAnchor
    
    const themesGrid = new Gtk.Box({
        cssClasses: ["themes-grid"],
        orientation: Gtk.Orientation.VERTICAL,
        spacing: 10,
    });
    
    currentGridBox = themesGrid;
    fetchThemes(themesGrid);

    return (
        <window
            name={`theme-manager-${id}`}
            class="ThemeManager"
            gdkmonitor={gdkmonitor}
            exclusivity={Astal.Exclusivity.IGNORE}
            anchor={TOP | BOTTOM | LEFT | RIGHT}
            application={app}
            visible={false}
            keymode={Astal.Keymode.ON_DEMAND} // allow clicking off maybe
            onNotifyVisible={(self) => {
                if (self.visible) {
                    fetchThemes()
                }
            }}
        >
            <box cssClasses={["theme-manager-wrapper"]}>
                <button 
                    hexpand 
                    vexpand 
                    cssClasses={["click-away-btn"]} 
                    onClicked={() => app.toggle_window(`theme-manager-${id}`)}
                />
                <box 
                    cssClasses={["theme-manager-content"]} 
                    orientation={Gtk.Orientation.VERTICAL}
                    valign={Gtk.Align.START}
                    halign={Gtk.Align.END}
                    marginTop={55}
                    marginRight={10}
                >
                    {/* Top Actions Grid (2 columns) */}
                    <box cssName="top-actions" spacing={10} homogeneous>
                        <DiceTile />
                        <SaveTile />
                    </box>
                    
                    <label label="Saved Themes" cssName="section-title" halign={Gtk.Align.START} />
                    
                    {/* Saved Themes Grid */}
                    {themesGrid}
                </box>
            </box>
        </window>
    )
}
