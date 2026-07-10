import Gio from "gi://Gio"
import app from "ags/gtk4/app"
import style from "../style.scss"

export function setupThemeWatcher() {
  const walFile = Gio.File.new_for_path("/home/hal/.cache/wal/colors.scss")
  const monitor = walFile.monitor_file(Gio.FileMonitorFlags.NONE, null)

  monitor.connect("changed", () => {
    // AGS compiles SCSS internally — just re-apply the source file
    app.reset_css()
    app.apply_css(style)
  })
}
