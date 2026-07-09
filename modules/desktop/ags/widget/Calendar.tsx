import app from "ags/gtk4/app"
import { Astal, Gtk, Gdk } from "ags/gtk4"

export default function Calendar(gdkmonitor: Gdk.Monitor) {
  const { TOP, RIGHT, BOTTOM } = Astal.WindowAnchor

  return (
    <window
      name="calendar"
      class="Calendar"
      gdkmonitor={gdkmonitor}
      anchor={TOP | RIGHT | BOTTOM}
      application={app}
      visible={false}
      keymode={Astal.Keymode.ON_DEMAND}
    >
      <box cssName="calendar-pane">
        <Gtk.Calendar />
      </box>
    </window>
  )
}
