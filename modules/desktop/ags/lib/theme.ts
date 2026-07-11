import Gio from "gi://Gio"
import GLib from "gi://GLib"
import app from "ags/gtk4/app"

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

let themeMonitor: Gio.FileMonitor | null = null

export function setupThemeWatcher() {
  const walDir = Gio.File.new_for_path(GLib.get_home_dir() + "/.cache/wal")
  themeMonitor = walDir.monitor_directory(Gio.FileMonitorFlags.NONE, null)

  const scssPath = GLib.get_home_dir() + "/Halix/modules/desktop/ags/style.scss"
  const cssPath = "/tmp/ags-style.css"

  let timeoutId: number | null = null

  themeMonitor.connect("changed", (monitor, file, other_file, event_type) => {
    // Ignore DELETED events
    if (event_type === Gio.FileMonitorEvent.DELETED) return;

    if (timeoutId !== null) {
      GLib.source_remove(timeoutId)
    }

    timeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 500, () => {
      timeoutId = null
      
      ;(async () => {
        try {
          console.log("Compiling new SCSS...")
          const sassBin = GLib.get_home_dir() + "/Halix/modules/desktop/ags/node_modules/.bin/sass"
          await spawnAsync([sassBin, scssPath, cssPath])
          console.log("Applying new CSS...")
          app.reset_css()
          app.apply_css(cssPath)
          console.log("Theme applied successfully!")
        } catch (e) {
          console.error("Failed to compile/apply SCSS on change:", e)
        }
      })()

      return GLib.SOURCE_REMOVE
    })
  })
}
