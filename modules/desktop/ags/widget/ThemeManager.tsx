import app from "ags/gtk4/app"
import { Astal, Gtk, Gdk } from "ags/gtk4"
import { execAsync } from "ags/process"
import { createState } from "ags"

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
        await execAsync(['sh', '-c', `echo "${path}" > /tmp/current_wallpaper`])
        await execAsync(['wal', '-i', path, '-n', '-q']).catch(console.error)
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
            await fetchThemes()
        }
    } catch (err) {
        console.error("Failed to save theme:", err)
    }
}

const deleteTheme = async (name: string) => {
    try {
        await execAsync(['sh', '-c', `rm -f ~/.config/halix-themes/"${name}"`])
        await fetchThemes()
    } catch (err) {
        console.error("Failed to delete theme:", err)
    }
}

function DiceTile() {
    return (
        <button cssClasses={["theme-tile", "dice-tile"]} hexpand onClicked={selectRandomWallpaper}>
            <box orientation={Gtk.Orientation.VERTICAL} valign={Gtk.Align.CENTER}>
                <label label="" cssClasses={["icon"]} />
                <label label="Dice" />
            </box>
        </button>
    )
}

function SaveTile() {
    return (
        <button cssClasses={["theme-tile", "save-tile"]} hexpand onClicked={saveCurrentTheme}>
            <box orientation={Gtk.Orientation.VERTICAL} valign={Gtk.Align.CENTER}>
                <label label="" cssClasses={["icon"]} />
                <label label="Save" />
            </box>
        </button>
    )
}

function ThemeThumbnail({ theme }: { theme: Theme }) {
    return (
        <box cssClasses={["theme-thumbnail-container"]} widthRequest={160} heightRequest={100} css={`background-image: url('file://${theme.path}');`}>
            <box cssClasses={["theme-thumbnail-overlay"]} hexpand vexpand valign={Gtk.Align.FILL} halign={Gtk.Align.FILL}>
                <box valign={Gtk.Align.CENTER} halign={Gtk.Align.CENTER} spacing={8}>
                    <button cssClasses={["select-btn"]} onClicked={() => applyTheme(theme.path)}>
                        <label label="Select" />
                    </button>
                    <button cssClasses={["delete-btn"]} onClicked={() => deleteTheme(theme.name)}>
                        <label label="Delete" />
                    </button>
                </box>
            </box>
        </box>
    )
}

export default function ThemeManager(gdkmonitor: Gdk.Monitor, id: number = 0) {
    const { TOP, BOTTOM, LEFT, RIGHT } = Astal.WindowAnchor

    fetchThemes()

    const hide = () => app.toggle_window(`theme-manager-${id}`)

    return (
        <window
            name={`theme-manager-${id}`}
            class="ThemeManager"
            gdkmonitor={gdkmonitor}
            exclusivity={Astal.Exclusivity.IGNORE}
            anchor={TOP | BOTTOM | LEFT | RIGHT}
            application={app}
            visible={false}
            keymode={Astal.Keymode.ON_DEMAND}
            onNotifyVisible={(self) => {
                if (self.visible) fetchThemes()
            }}
            onKeyPressed={(self, keyval) => {
                if (keyval === Gdk.KEY_Escape) hide()
            }}
        >
            <overlay>
                {/* Background: transparent button covering the full window */}
                <button
                    hexpand
                    vexpand
                    cssClasses={["click-away-btn"]}
                    onClicked={hide}
                />
                {/* Foreground: the actual content panel */}
                <box
                    cssClasses={["theme-manager-content"]}
                    orientation={Gtk.Orientation.VERTICAL}
                    valign={Gtk.Align.START}
                    halign={Gtk.Align.END}
                    margin_top={55}
                    margin_end={10}
                >
                    <box cssClasses={["top-actions"]} spacing={10} homogeneous>
                        <DiceTile />
                        <SaveTile />
                    </box>

                    <label label="Saved Themes" cssClasses={["section-title"]} halign={Gtk.Align.START} />

                    <box cssClasses={["themes-grid"]} orientation={Gtk.Orientation.VERTICAL} spacing={10}>
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
            </overlay>
        </window>
    )
}
