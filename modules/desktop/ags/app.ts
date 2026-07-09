import app from "ags/gtk4/app"
import style from "./style.scss"
import Bar from "./widget/Bar"
import Calendar from "./widget/Calendar"
import { execAsync } from "ags/process"
import Gio from "gi://Gio"

const windows: any[] = []

app.start({
  css: style,
  main() {
    windows.push(...app.get_monitors().map((monitor, i) => Bar(monitor, i)))
    windows.push(...app.get_monitors().map((monitor, i) => Calendar(monitor, i)))

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
  },
})
