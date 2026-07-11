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

export function setupThemeWatcher() {
  const walFile = Gio.File.new_for_path(GLib.get_home_dir() + "/.cache/wal/colors.scss")
  const monitor = walFile.monitor_file(Gio.FileMonitorFlags.NONE, null)

  const scssPath = GLib.get_home_dir() + "/Halix/modules/desktop/ags/style.scss"
  const cssPath = "/tmp/ags-style.css"

  let timeoutId: number | null = null

  monitor.connect("changed", () => {
    if (timeoutId !== null) {
      GLib.source_remove(timeoutId)
    }

    timeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 100, () => {
      timeoutId = null
      
      ;(async () => {
        try {
          await spawnAsync(["npx", "sass", scssPath, cssPath])
          app.reset_css()
          app.apply_css(cssPath)
        } catch (e) {
          console.error("Failed to compile/apply SCSS on change:", e)
        }
      })()

      return GLib.SOURCE_REMOVE
    })
  })
}
