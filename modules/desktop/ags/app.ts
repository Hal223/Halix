import app from "ags/gtk4/app"
import style from "./style.scss"
import Test from "./widget/test"
import Bar from "./widget/bar"
import Calendar from "./widget/calendar"
import ThemeManager from "./widget/thememanager"
import { setupThemeWatcher } from "./lib/theme"
import { VolumeOSD, showVolumeOSD } from "./widget/audio"

app.start({
  css: style,
  requestHandler(request, res) {
    // Hyprland keybind sends: ags request volume-up / volume-down / volume-mute
    if (request === "volume-up" || request === "volume-down" || request === "volume-mute") {
      showVolumeOSD()
      res("ok")
      return
    }
    res("ok")
  },
  main() {
    app.get_monitors().forEach((monitor, i) => {
      Test(monitor, i)
      Bar(monitor, i)
      Calendar(monitor, i)
      VolumeOSD(monitor, i) // Only primary monitor (id=0) creates a window
    })

    setupThemeWatcher()
  },
})
