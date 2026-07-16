import app from "ags/gtk4/app"
import { Astal, Gtk, Gdk } from "ags/gtk4"
import { createPoll } from "ags/time"
import { createBinding as bind } from "ags"
import Hyprland from "gi://AstalHyprland"
import AstalTray from "gi://AstalTray"
import ThemeSwitcher from "./themeswitcher"
import { VolumeButton } from "./audio"

function Workspaces({ id }: { id: number }) {
  const hyprland = Hyprland.get_default()

  // Assign workspaces 1-5 to primary monitor (id 0) and 6-10 to secondary (id 1)
  const workspaces = id === 0 ? [1, 2, 3, 4, 5] : [6, 7, 8, 9, 10]

  return (
    <box cssClasses={["workspaces"]} spacing={4}>
      {workspaces.map(wsId => (
        <button
          cssClasses={bind(hyprland, "focusedWorkspace").as(fw =>
            fw.id === wsId ? ["workspace-btn", "focused"] : ["workspace-btn"]
          )}
          onClicked={() => hyprland.dispatch("workspace", wsId.toString())}
        >
          <label label={wsId.toString()} />
        </button>
      ))}
    </box>
  )
}

function CenterModules({ id }: { id: number }) {
  return (
    <box $type="center">
      <Workspaces id={id} />
    </box>
  )
}

function Clock({ id }: { id: number }) {
  const time = createPoll("", 1000, "date")
  return (
    <button onClicked={() => app.toggle_window(`calendar-${id}`)} cssClasses={["clock-btn"]}>
      <label label={time} />
    </button>
  )
}

function SysTray() {
  const tray = AstalTray.get_default()

  const container = (
    <box cssClasses={["systray"]} spacing={0} />
  ) as any

  const updateTray = () => {
    const items = tray.get_items() ?? []
    // Clear current children
    let child = container.get_first_child()
    while (child) {
      container.remove(child)
      child = container.get_first_child()
    }

    // Create and append new children
    items.forEach((item: any) => {
      const mb = (
        <menubutton
          tooltipMarkup={bind(item, "tooltipMarkup")}
          menuModel={bind(item, "menuModel")}
        >
          <image gicon={bind(item, "gicon")} />
        </menubutton>
      ) as any
      mb.insert_action_group("dbusmenu", item.actionGroup)
      container.append(mb)
    })

    container.visible = items.length > 0
  }

  bind(tray, "items").subscribe(updateTray)
  updateTray()

  return container
}

function EndModules({ id }: { id: number }) {
  return (
    <box $type="end" hexpand halign={Gtk.Align.END} cssClasses={["right-modules"]} spacing={20}>
      <SysTray />
      <VolumeButton id={id} />
      <ThemeSwitcher id={id} />
      <Clock id={id} />
    </box>
  )
}

export default function Bar(gdkmonitor: Gdk.Monitor, id: number = 0) {
  const { TOP, LEFT, RIGHT } = Astal.WindowAnchor
  const hyprland = Hyprland.get_default()

  return (
    <window
      visible={bind(hyprland, "focusedClient").as(() => {
        // Find if there is any fullscreen client on THIS specific monitor
        const monitor = hyprland.get_monitor(id)
        const clients = hyprland.get_clients()
        const hasFullscreen = clients.some((c: any) => c.monitor?.id === monitor?.id && c.fullscreen)
        return !hasFullscreen
      })}
      name={`bar-${id}`}
      class="Bar"
      gdkmonitor={gdkmonitor}
      exclusivity={Astal.Exclusivity.EXCLUSIVE}
      anchor={TOP | LEFT | RIGHT}
      application={app}
    >
      <centerbox>
        <box $type="start" />
        <CenterModules id={id} />
        <EndModules id={id} />
      </centerbox>
    </window>
  )
}
