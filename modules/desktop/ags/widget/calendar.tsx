import app from "ags/gtk4/app"
import { Astal, Gtk, Gdk } from "ags/gtk4"

export default function Calendar(gdkmonitor: Gdk.Monitor, id: number = 0) {
  const { TOP, RIGHT } = Astal.WindowAnchor

  return (
    <window
      name={`calendar-${id}`}
      class="Calendar"
      gdkmonitor={gdkmonitor}
      anchor={TOP | RIGHT}
      application={app}
      visible={false}
    >
      <box cssClasses={["calendar-pane"]}>
        <Gtk.Calendar />
      </box>
    </window>
  )
}
