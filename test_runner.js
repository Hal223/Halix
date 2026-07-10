import app from "ags/gtk4/app"
import { Astal, Gtk, Gdk } from "ags/gtk4"
import TestOverlay from "../../../tmp/test.js"

app.start({
    requestHandler(request, res) { res("ok") },
    main() {
        const win = TestOverlay(Gdk.Display.get_default().get_monitors().get_item(0))
        win.visible = true;
        setTimeout(() => app.quit(), 500)
    }
})
