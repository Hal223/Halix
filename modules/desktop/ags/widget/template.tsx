import app from "ags/gtk4/app"
import { Astal, Gtk, Gdk } from "ags/gtk4"

// ==============================================================================
// 🛠️ GENERIC WIDGET TEMPLATE
// ==============================================================================
// This is a boilerplate for creating new popup widgets using the shared
// generic CSS classes defined in style.scss.
// 
// Usage: 
// 1. Copy this file and rename 'TemplateWidget' to your desired widget name.
// 2. Import your new widget in app.ts and pass it to the App.
// 3. Create a toggle button in your bar.tsx to show/hide it.
// ==============================================================================

export default function TemplateWidget(gdkmonitor: Gdk.Monitor, id: number = 0) {
  const { TOP, RIGHT } = Astal.WindowAnchor

  // 1. Title
  const title = new Gtk.Label({
    label: "My Custom Widget",
    css_classes: ["generic-widget-title"],
    halign: Gtk.Align.START,
    hexpand: true,
  })

  // 2. Action Tile (Large interactive card)
  const tileIcon = new Gtk.Label({ label: "🚀", css_classes: ["icon"] })
  const tileLbl = new Gtk.Label({ label: "Launch" })
  const tileInner = new Gtk.Box({
    orientation: Gtk.Orientation.VERTICAL,
    spacing: 6,
    halign: Gtk.Align.CENTER,
    valign: Gtk.Align.CENTER,
  })
  tileInner.append(tileIcon)
  tileInner.append(tileLbl)

  const actionTile = new Gtk.Button({ 
    css_classes: ["generic-widget-tile"], 
    hexpand: true 
  })
  actionTile.set_child(tileInner)
  actionTile.connect("clicked", () => {
    console.log("Action tile clicked!")
  })

  // 3. Standard Button
  const standardBtn = new Gtk.Button({ 
    css_classes: ["generic-widget-btn"],
    halign: Gtk.Align.END
  })
  standardBtn.set_child(new Gtk.Label({ label: "Click Me" }))
  standardBtn.connect("clicked", () => {
    console.log("Standard button clicked!")
  })

  // 4. Content Layout
  const content = new Gtk.Box({
    orientation: Gtk.Orientation.VERTICAL,
    // This class provides the glassy background, rounded corners, and shadow!
    css_classes: ["generic-widget-content"],
    spacing: 16, // Space between title, tile, and button
  })
  
  content.append(title)
  content.append(actionTile)
  content.append(standardBtn)

  // 5. The Window wrapper
  return (
    <window
      name={`template-widget-${id}`}
      class="TemplateWidget"
      gdkmonitor={gdkmonitor}
      anchor={TOP | RIGHT}
      application={app}
      visible={false} // Hidden by default, toggled via app.toggle_window()
      keymode={Astal.Keymode.ON_DEMAND} // Captures keyboard input when focused
    >
      {content}
    </window>
  )
}
