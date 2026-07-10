import app from "ags/gtk4/app"

export default function ThemeSwitcher({ id }: { id: number }) {
  return (
    <box className="theme-switcher-box">
      <button onClicked={() => app.toggle_window(`theme-manager-${id}`)} className="theme-btn">
        <label label="" />
      </button>
    </box>
  )
}
