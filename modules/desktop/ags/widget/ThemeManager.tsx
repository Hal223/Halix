import app from "ags/gtk4/app"
import { Astal, Gtk, Gdk } from "ags/gtk4"
import { execAsync, exec } from "ags/process"
import { Variable, createBinding as bind } from "ags"
import Hyprland from "gi://AstalHyprland"

interface Theme {
    name: string
    path: string
}

const savedThemes = Variable<Theme[]>([])

const fetchThemes = async () => {
    try {
        const out = await execAsync(['sh', '-c', 'for f in ~/.config/halix-themes/*; do [ -e "$f" ] && echo "$(basename "$f")|$(cat "$f")"; done'])
        if (!out) {
            savedThemes.set([])
            return
        }
        const themes = out.split('\n').filter(Boolean).map(line => {
            const [name, path] = line.split('|')
            return { name, path }
        })
        savedThemes.set(themes)
    } catch (err) {
        console.error(err)
        savedThemes.set([])
    }
}

// Fetch themes initially
fetchThemes()

const applyTheme = async (path: string) => {
    try {
        // Save as current wallpaper for state tracking
        await execAsync(['sh', '-c', `echo "${path}" > /tmp/current_wallpaper`])
        
        // Generate pywal colors
        await execAsync(['wal', '-i', path, '-n', '-q']).catch(console.error)
        
        // Try to apply with hyprpaper
        await execAsync(['hyprctl', 'hyprpaper', 'preload', path]).catch(console.error)
        await execAsync(['hyprctl', 'hyprpaper', 'wallpaper', `",${path}"`]).catch(console.error)
        
        // Restart waybar if necessary or let the user's Pywal setup do its thing.
        // Actually, the user has theme-manager that restarts waybar in sway, but for AGS,
        // if they have pywal css imported, they might need to restart AGS. 
        // Or we can just call setupThemeWatcher() which they already have in app.ts!
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
        <button cssName="theme-tile dice-tile" onClicked={selectRandomWallpaper}>
            <box vertical valign={Gtk.Align.CENTER}>
                <label label="" cssName="icon" />
                <label label="Dice" />
            </box>
        </button>
    )
}

function SaveTile() {
    return (
        <button cssName="theme-tile save-tile" onClicked={saveCurrentTheme}>
            <box vertical valign={Gtk.Align.CENTER}>
                <label label="" cssName="icon" />
                <label label="Save" />
            </box>
        </button>
    )
}

function ThemeThumbnail({ theme }: { theme: Theme }) {
    return (
        <box cssName="theme-thumbnail-container" css={`background-image: url('${theme.path}');`}>
            <box cssName="theme-thumbnail-overlay" hexpand vexpand valign={Gtk.Align.FILL} halign={Gtk.Align.FILL}>
                <box valign={Gtk.Align.CENTER} halign={Gtk.Align.CENTER} spacing={8}>
                    <button cssName="overlay-btn select-btn" onClicked={() => applyTheme(theme.path)}>
                        <label label="Select" />
                    </button>
                    <button cssName="overlay-btn delete-btn" onClicked={() => deleteTheme(theme.name)}>
                        <label label="Delete" />
                    </button>
                </box>
            </box>
        </box>
    )
}

export default function ThemeManager(gdkmonitor: Gdk.Monitor, id: number = 0) {
    const { TOP, RIGHT } = Astal.WindowAnchor
    
    // We use a simple vertical box holding two rows/grids.
    // Since GTK4 CSS grid isn't always perfectly exposed in JSX without FlowBox/GridView, 
    // we can use a Box with FlowBox or just VBox of HBoxes for simplicity.
    // Let's use a FlowBox for the saved themes to wrap them nicely.
    
    return (
        <window
            name={`theme-manager-${id}`}
            class="ThemeManager"
            gdkmonitor={gdkmonitor}
            exclusivity={Astal.Exclusivity.IGNORE}
            anchor={TOP | RIGHT}
            application={app}
            visible={false}
            keymode={Astal.Keymode.ON_DEMAND} // allow clicking off maybe
            onNotifyVisible={(self) => {
                if (self.visible) {
                    fetchThemes()
                }
            }}
        >
            <box cssName="theme-manager-content" vertical>
                {/* Top Actions Grid (2 columns) */}
                <box cssName="top-actions" spacing={10} homogeneous>
                    <DiceTile />
                    <SaveTile />
                </box>
                
                <label label="Saved Themes" cssName="section-title" halign={Gtk.Align.START} />
                
                {/* Saved Themes Grid */}
                <flowbox
                    cssName="themes-grid"
                    selectionMode={Gtk.SelectionMode.NONE}
                    maxChildrenPerLine={2}
                    minChildrenPerLine={2}
                    rowSpacing={10}
                    columnSpacing={10}
                    setup={(self) => {
                        savedThemes.subscribe((themes) => {
                            // Remove old children
                            let child = self.get_first_child()
                            while (child) {
                                const next = child.get_next_sibling()
                                self.remove(child)
                                child = next
                            }
                            
                            // Add new themes
                            themes.forEach(theme => {
                                self.append(<ThemeThumbnail theme={theme} /> as Gtk.Widget)
                            })
                        })
                    }}
                />
            </box>
        </window>
    )
}
