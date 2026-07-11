import app from "ags/gtk4/app"
import { Astal, Gtk, Gdk } from "ags/gtk4"

export default function Test(gdkmonitor: Gdk.Monitor, id: number = 0) {
    const { TOP, LEFT } = Astal.WindowAnchor

    return (
        <window
            name={`test-${id}`}
            class="Test"
            gdkmonitor={gdkmonitor}
            anchor={TOP | LEFT}
            application={app}
            visible={false}
        >
            <button onClicked={(self) => console.log(self, "clicked")}>
                <label label="Click me!" />
            </button>
        </window>
    )
}