import Gio from "gi://Gio"
import { execAsync } from "ags/process"
import app from "ags/gtk4/app"

export function setupThemeWatcher() {
  const walFile = Gio.File.new_for_path("/home/hal/.cache/wal/colors.scss")
  const monitor = walFile.monitor_file(Gio.FileMonitorFlags.NONE, null)

  monitor.connect("changed", () => {
    // Recompile SCSS and apply it dynamically
    execAsync(["sass", "/home/hal/Halix/modules/desktop/ags/style.scss", "/tmp/ags-style.css"])
      .then(() => {
        app.reset_css()
        app.apply_css("/tmp/ags-style.css")
      })
      .catch(console.error)
  })
}
