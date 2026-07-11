import app from "ags/gtk4/app"
import { Gtk } from "ags/gtk4"
import ThemeManagerContent from "./thememanager"

export default function ThemeSwitcher({ id }: { id: number }) {
  const popover = new Gtk.Popover()
  popover.set_has_arrow(false)
  popover.set_css_classes(["transparent-popover"])
  popover.set_child(ThemeManagerContent({ id, close: () => popover.popdown() }))

  return (
    <menubutton
      cssClasses={["theme-btn"]}
      tooltipText="Theme Manager"
      popover={popover}
    >
      <label label={"🎨"} />
    </menubutton>
  )
}
