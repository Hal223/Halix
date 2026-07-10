import app from "ags/gtk4/app"

export default function ThemeSwitcher({ id }: { id: number }) {
  return (
    <button
      cssClasses={["theme-btn"]}
      onClicked={() => {
        try {
          app.toggle_window(`theme-manager-${id}`)
        } catch (e) {
          console.error("ThemeSwitcher: toggle failed –", e)
        }
      }}
      tooltipText="Theme Manager"
    >
      <label label={"🎨"} />
    </button>
  )
}
