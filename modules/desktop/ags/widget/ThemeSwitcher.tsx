import app from "ags/gtk4/app"

export default function ThemeSwitcher({ id }: { id: number }) {
  return (
    <box cssClasses={["theme-switcher-box"]}>
      <button onClicked={() => app.toggle_window(`theme-manager-${id}`)} cssClasses={["theme-btn"]}>
        <label label="" />
      </button>
    </box>
  )
}
