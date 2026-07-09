import app from "ags/gtk4/app"
import { Astal, Gtk, Gdk } from "ags/gtk4"
import { execAsync } from "ags/process"
import { createPoll } from "ags/time"
import ThemeSwitcher from "./ThemeSwitcher"

export default function Bar(gdkmonitor: Gdk.Monitor, id: number = 0) {
  const time = createPoll("", 1000, "date")
  const { TOP, LEFT, RIGHT } = Astal.WindowAnchor

  return (
    <window
      visible
      name={`bar-${id}`}
      class="Bar"
      gdkmonitor={gdkmonitor}
      exclusivity={Astal.Exclusivity.EXCLUSIVE}
      anchor={TOP | LEFT | RIGHT}
      application={app}
    >
      <centerbox cssName="centerbox">
        <button
          $type="start"
          onClicked={() => execAsync("echo hello").then(console.log)}
          hexpand
          halign={Gtk.Align.CENTER}
        >
          <label label="Welcome to AGS!!" />
        </button>
        <box $type="center" />
        <box $type="end" hexpand halign={Gtk.Align.END} cssName="right-modules" spacing={20}>
          <ThemeSwitcher />
          <button onClicked={() => app.toggle_window(`calendar-${id}`)} cssName="clock-btn">
            <label label={time} />
          </button>
        </box>
      </centerbox>
    </window>
  )
}
