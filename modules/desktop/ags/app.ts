import app from "ags/gtk4/app"
import style from "./style.scss"
import Test from "./widget/test"
import Bar from "./widget/bar"
import Calendar from "./widget/calendar"
import ThemeManager from "./widget/thememanager"
import { setupThemeWatcher } from "./lib/theme"

app.start({
  css: style,
  requestHandler(request, res) {
    res("ok")
  },
  main() {
    app.get_monitors().forEach((monitor, i) => {
      Test(monitor, i)
      Bar(monitor, i)
      Calendar(monitor, i)
    })

    setupThemeWatcher()
  },
})
