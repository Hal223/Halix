import { Gtk } from "ags/gtk4"
import { execAsync } from "ags/process"

export default function ThemeSwitcher() {
  return (
    <box cssName="theme-switcher-box">
      <button onClicked={() => execAsync("theme-manager").catch(console.error)} cssName="theme-btn">
        <label label="" />
      </button>
    </box>
  )
}
