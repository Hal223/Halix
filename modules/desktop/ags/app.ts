import app from "ags/gtk4/app"
import style from "./style.scss"
import Bar from "./widget/Bar"
import Calendar from "./widget/Calendar"
import ThemeManager from "./widget/ThemeManager"
import { setupThemeWatcher } from "./lib/theme"

app.start({
  css: style,
  requestHandler(request, res) {
    res("ok")
  },
  main() {
    app.get_monitors().forEach((monitor, i) => {
      Bar(monitor, i)
      Calendar(monitor, i)
      ThemeManager(monitor, i)
    })

    setupThemeWatcher()
  },
})
