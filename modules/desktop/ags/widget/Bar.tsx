import app from "ags/gtk4/app"
import { Astal, Gtk, Gdk } from "ags/gtk4"
import { execAsync } from "ags/process"
import { createPoll } from "ags/time"
import { bind } from "ags"
import Hyprland from "gi://AstalHyprland"
import ThemeSwitcher from "./ThemeSwitcher"

function StartModules() {
  return (
    <button
      $type="start"
      onClicked={() => execAsync("echo hello").then(console.log)}
      hexpand
      halign={Gtk.Align.CENTER}
    >
      <label label="Welcome to AGS!!" />
    </button>
  )
}

function Workspaces() {
  const hyprland = Hyprland.get_default()

  return (
    <box cssName="workspaces" spacing={4}>
      {bind(hyprland, "workspaces").as(wss =>
        wss
          .filter(ws => ws.id > 0) // Ignore special/scratchpad workspaces if any
          .sort((a, b) => a.id - b.id)
          .map(ws => (
            <button
              cssName={bind(hyprland, "focusedWorkspace").as(fw =>
                fw === ws ? "workspace-btn focused" : "workspace-btn"
              )}
              onClicked={() => ws.focus()}
            >
              <label label={ws.id.toString()} />
            </button>
          ))
      )}
    </box>
  )
}

function CenterModules() {
  return (
    <box $type="center">
      <Workspaces />
    </box>
  )
}

function Clock({ id }: { id: number }) {
  const time = createPoll("", 1000, "date")
  return (
    <button onClicked={() => app.toggle_window(`calendar-${id}`)} cssName="clock-btn">
      <label label={time} />
    </button>
  )
}

function EndModules({ id }: { id: number }) {
  return (
    <box $type="end" hexpand halign={Gtk.Align.END} cssName="right-modules" spacing={20}>
      <ThemeSwitcher />
      <Clock id={id} />
    </box>
  )
}

export default function Bar(gdkmonitor: Gdk.Monitor, id: number = 0) {
  const { TOP, LEFT, RIGHT } = Astal.WindowAnchor
  const hyprland = Hyprland.get_default()

  return (
    <window
      visible={bind(hyprland, "focusedClient").as((client: any) => !client?.fullscreen)}
      name={`bar-${id}`}
      class="Bar"
      gdkmonitor={gdkmonitor}
      exclusivity={Astal.Exclusivity.EXCLUSIVE}
      anchor={TOP | LEFT | RIGHT}
      application={app}
    >
      <centerbox cssName="centerbox">
        <StartModules />
        <CenterModules />
        <EndModules id={id} />
      </centerbox>
    </window>
  )
}
