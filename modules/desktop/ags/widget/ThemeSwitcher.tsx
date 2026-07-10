import app from "ags/gtk4/app"

export default function ThemeSwitcher({ id }: { id: number }) {
  return (
    <box cssName="theme-switcher-box">
      <button onClicked={() => app.toggle_window(`theme-manager-${id}`)} cssName="theme-btn">
        <label label="" />
      </button>
    </box>
  )
}
