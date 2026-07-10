import app from "ags/gtk4/app"
import { Astal, Gtk, Gdk } from "ags/gtk4"
import { execAsync } from "ags/process"
import { createBinding as bind, createState } from "ags"
import Hyprland from "gi://AstalHyprland"

interface Theme {
    name: string
    path: string
}

const [themesVar, setThemes] = createState<Theme[]>([])

const fetchThemes = async () => {
    try {
        const out = await execAsync(['sh', '-c', 'for f in ~/.config/halix-themes/*; do [ -e "$f" ] && echo "$(basename "$f")|$(cat "$f")"; done'])
        
        if (!out) {
            setThemes([])
            return
        }

        const themes = out.split('\n').filter(Boolean).map(line => {
            const [name, path] = line.split('|')
            return { name, path }
        })
        
        setThemes(themes)
    } catch (err) {
        console.error(err)
        setThemes([])
    }
}

const applyTheme = async (path: string) => {
    try {
        // Save as current wallpaper for state tracking
        await execAsync(['sh', '-c', `echo "${path}" > /tmp/current_wallpaper`])
        
        // Generate pywal colors
        await execAsync(['wal', '-i', path, '-n', '-q']).catch(console.error)
        
        // Try to apply with swww
        await execAsync(['swww', 'img', path, '--transition-type', 'wave', '--transition-angle', '30', '--transition-step', '120', '--transition-duration', '0.8', '--transition-fps', '60', '--filter', 'Bilinear']).catch(console.error)
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
        <button className="theme-tile dice-tile" hexpand onClicked={selectRandomWallpaper}>
            <box orientation={Gtk.Orientation.VERTICAL} valign={Gtk.Align.CENTER}>
                <label label="" className="icon" />
                <label label="Dice" />
            </box>
        </button>
    )
}

function SaveTile() {
    return (
        <button className="theme-tile save-tile" hexpand onClicked={saveCurrentTheme}>
            <box orientation={Gtk.Orientation.VERTICAL} valign={Gtk.Align.CENTER}>
                <label label="" className="icon" />
                <label label="Save" />
            </box>
        </button>
    )
}

function ThemeThumbnail({ theme }: { theme: Theme }) {
    return (
        <box className="theme-thumbnail-container" widthRequest={160} heightRequest={100} css={`background-image: url('file://${theme.path}');`}>
            <box className="theme-thumbnail-overlay" hexpand vexpand valign={Gtk.Align.FILL} halign={Gtk.Align.FILL}>
                <box valign={Gtk.Align.CENTER} halign={Gtk.Align.CENTER} spacing={8}>
                    <button className="select-btn" onClicked={() => applyTheme(theme.path)}>
                        <label label="Select" />
                    </button>
                    <button className="delete-btn" onClicked={() => deleteTheme(theme.name)}>
                        <label label="Delete" />
                    </button>
                </box>
            </box>
        </box>
    )
}

export default function ThemeManager(gdkmonitor: Gdk.Monitor, id: number = 0) {
    const { TOP, BOTTOM, LEFT, RIGHT } = Astal.WindowAnchor
    
    // Initial fetch
    fetchThemes();

    return (
        <window
            name={`theme-manager-${id}`}
            className="ThemeManager"
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
            <box className="theme-manager-wrapper">
                <button 
                    hexpand 
                    vexpand 
                    className="click-away-btn" 
                    onClicked={() => app.toggle_window(`theme-manager-${id}`)}
                />
                
                <box orientation={Gtk.Orientation.VERTICAL}>
                    <button 
                        vexpand 
                        className="click-away-btn" 
                        onClicked={() => app.toggle_window(`theme-manager-${id}`)}
                    />
                    
                    <box 
                        className="theme-manager-content" 
                        orientation={Gtk.Orientation.VERTICAL}
                        valign={Gtk.Align.START}
                        halign={Gtk.Align.END}
                        margin_top={55}
                        margin_end={10}
                    >
                        {/* Top Actions Grid (2 columns) */}
                        <box className="top-actions" spacing={10} homogeneous>
                            <DiceTile />
                            <SaveTile />
                        </box>
                        
                        <label label="Saved Themes" className="section-title" halign={Gtk.Align.START} />
                        
                        {/* Saved Themes Grid */}
                        <box className="themes-grid" orientation={Gtk.Orientation.VERTICAL} spacing={10}>
                            {themesVar.as(themes => {
                                const rows: any[] = []
                                for (let i = 0; i < themes.length; i += 2) {
                                    const theme1 = themes[i]
                                    const theme2 = themes[i + 1]
                                    rows.push(
                                        <box orientation={Gtk.Orientation.HORIZONTAL} spacing={10} homogeneous>
                                            <ThemeThumbnail theme={theme1} />
                                            {theme2 ? <ThemeThumbnail theme={theme2} /> : <box />}
                                        </box>
                                    )
                                }
                                return rows
                            })}
                        </box>
                    </box>
                    
                    <button 
                        vexpand 
                        className="click-away-btn" 
                        onClicked={() => app.toggle_window(`theme-manager-${id}`)}
                    />
                </box>
                
                <button 
                    hexpand 
                    vexpand 
                    className="click-away-btn" 
                    onClicked={() => app.toggle_window(`theme-manager-${id}`)}
                />
            </box>
        </window>
    )
}

