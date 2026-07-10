import app from "ags/gtk4/app"

export default function ThemeSwitcher({ id }: { id: number }) {
  return (
    <button
      cssClasses={["theme-btn"]}
      onClicked={() => app.toggle_window(`theme-manager-${id}`)}
      tooltipText="Theme Manager"
    >
      <label label={"🎨"} />
    </button>
  )
}
