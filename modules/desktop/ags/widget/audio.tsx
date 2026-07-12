import app from "ags/gtk4/app"
import { Astal, Gtk, Gdk } from "ags/gtk4"
import { createBinding as bind, createState } from "ags"
import GLib from "gi://GLib"
import AstalWp from "gi://AstalWp"
import { resolveAppInfo } from "../lib/audio-names"
import { playVolumeSound } from "../lib/volume-sound"

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getAudio() {
  return AstalWp.get_default()?.audio
}

function volumeIcon(vol: number, muted: boolean): string {
  if (muted || vol === 0) return "󰖁"   // muted
  if (vol < 0.34)         return "󰕿"   // low
  if (vol < 0.67)         return "󰖀"   // medium
  return "󰕾"                           // high
}

// Clamp volume between 0 and 1.5 (150% — matches wpctl -l 1.5)
function clamp(v: number, min = 0, max = 1.5) {
  return Math.max(min, Math.min(max, v))
}

// ─────────────────────────────────────────────────────────────────────────────
// OSD State (module-level singleton, shared by both scroll and hardware keys)
// ─────────────────────────────────────────────────────────────────────────────

let _osdWindow: Gtk.Window | null = null
let _osdHideTimer: number | null = null
let _osdSetVolume: ((v: number, muted: boolean) => void) | null = null

export function showVolumeOSD() {
  const audio = getAudio()
  const speaker = audio?.defaultSpeaker
  if (!speaker || !_osdWindow || !_osdSetVolume) return

  _osdSetVolume(speaker.volume, speaker.mute)
  _osdWindow.show()

  if (_osdHideTimer !== null) {
    GLib.source_remove(_osdHideTimer)
    _osdHideTimer = null
  }
  _osdHideTimer = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1500, () => {
    _osdWindow?.hide()
    _osdHideTimer = null
    return GLib.SOURCE_REMOVE
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// VolumeOSD — full-screen overlay, center of screen, auto-hides
// ─────────────────────────────────────────────────────────────────────────────

export function VolumeOSD(gdkmonitor: Gdk.Monitor, id: number = 0) {
  // Only create OSD on primary monitor (id 0)
  if (id !== 0) return null

  const [vol, setVol] = createState(0)
  const [muted, setMuted] = createState(false)

  // Expose setter to the module-level showVolumeOSD()
  _osdSetVolume = (v: number, m: boolean) => {
    setVol(v)
    setMuted(m)
  }

  const pct = bind(vol).as(v => Math.round(v * 100))
  const icon = bind(vol).as((v) => volumeIcon(v, muted()))
  const muteIcon = bind(muted).as(m => volumeIcon(vol(), m))

  // Large icon
  const iconLabel = new Gtk.Label({
    css_classes: ["osd-icon"],
    halign: Gtk.Align.CENTER,
  })
  iconLabel.label = ""
  // Bind combined icon (vol OR muted can change)
  bind(vol).subscribe(v => {
    iconLabel.label = volumeIcon(v, muted())
  })
  bind(muted).subscribe(m => {
    iconLabel.label = volumeIcon(vol(), m)
  })

  // Percentage text
  const pctLabel = new Gtk.Label({
    css_classes: ["osd-percentage"],
    halign: Gtk.Align.CENTER,
  })
  bind(vol).subscribe(v => {
    pctLabel.label = muted() ? "Muted" : `${Math.round(v * 100)}%`
  })
  bind(muted).subscribe(m => {
    pctLabel.label = m ? "Muted" : `${Math.round(vol() * 100)}%`
  })

  // Progress bar
  const bar = new Gtk.ProgressBar({
    css_classes: ["osd-bar"],
    hexpand: true,
  })
  bind(vol).subscribe(v => {
    bar.fraction = Math.min(1, v) // bar only shows 0-100% range
  })

  const content = new Gtk.Box({
    orientation: Gtk.Orientation.VERTICAL,
    css_classes: ["osd-content"],
    halign: Gtk.Align.CENTER,
    valign: Gtk.Align.CENTER,
    spacing: 8,
  })
  content.append(iconLabel)
  content.append(pctLabel)
  content.append(bar)

  const win = (
    <window
      name={`volume-osd-${id}`}
      class="VolumeOSD"
      gdkmonitor={gdkmonitor}
      anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.LEFT | Astal.WindowAnchor.RIGHT | Astal.WindowAnchor.BOTTOM}
      exclusivity={Astal.Exclusivity.IGNORE}
      keymode={Astal.Keymode.NONE}
      application={app}
      visible={false}
      clickThrough={true}
    >
      {content}
    </window>
  )

  _osdWindow = win as unknown as Gtk.Window
  return win
}

// ─────────────────────────────────────────────────────────────────────────────
// Device Row — single output or input device
// ─────────────────────────────────────────────────────────────────────────────

function DeviceRow({
  endpoint,
  onSelect,
}: {
  endpoint: any // AstalWp.Endpoint
  onSelect: () => void
}) {
  const isDefault = bind(endpoint, "is-default")
  const desc = bind(endpoint, "description").as(d =>
    d?.replace(/\s+\(.+?\)\s*$/, "") ?? endpoint.description ?? "Unknown Device"
  )

  const row = (
    <button
      cssClasses={isDefault.as(d => ["audio-device-row", ...(d ? ["active"] : [])])}
      onClicked={onSelect}
      halign={Gtk.Align.FILL}
      hexpand
    >
      <box spacing={8} halign={Gtk.Align.START}>
        <label
          cssClasses={["audio-device-icon"]}
          label={isDefault.as(d => (d ? "󰓃" : "󰓄"))}
        />
        <label
          cssClasses={["audio-device-name"]}
          label={desc}
          ellipsize={3 /* PANGO_ELLIPSIZE_END */}
          maxWidthChars={28}
          halign={Gtk.Align.START}
        />
      </box>
    </button>
  )
  return row
}

// ─────────────────────────────────────────────────────────────────────────────
// AppRow — per-application sink-input with slider + mute
// ─────────────────────────────────────────────────────────────────────────────

function AppRow({ stream }: { stream: any /* AstalWp.Endpoint */ }) {
  // Resolve friendly name / icon from binary name
  const nameProp = stream.name ?? stream.description ?? ""
  const { name, icon } = resolveAppInfo(nameProp, nameProp)

  const volBind = bind(stream, "volume")
  const muteBind = bind(stream, "mute")

  const slider = new Gtk.Scale({
    orientation: Gtk.Orientation.HORIZONTAL,
    hexpand: true,
    css_classes: ["app-volume-slider"],
    draw_value: false,
    adjustment: new Gtk.Adjustment({
      lower: 0,
      upper: 1,
      step_increment: 0.05,
      value: stream.volume,
    }),
  })

  // Keep slider in sync with stream
  volBind.subscribe(v => { slider.value = v })

  slider.connect("value-changed", () => {
    stream.volume = clamp(slider.value)
  })

  const muteBtn = (
    <button
      cssClasses={muteBind.as(m => ["app-mute-btn", ...(m ? ["muted"] : [])])}
      tooltipText={muteBind.as(m => (m ? "Unmute" : "Mute"))}
      onClicked={() => { stream.mute = !stream.mute }}
    >
      <label label={muteBind.as(m => (m ? "󰖁" : "󰕾"))} />
    </button>
  )

  return (
    <box cssClasses={["audio-app-row"]} spacing={8} hexpand>
      <label cssClasses={["app-icon"]} label={icon} />
      <label
        cssClasses={["app-name"]}
        label={name}
        ellipsize={3}
        maxWidthChars={14}
        halign={Gtk.Align.START}
      />
      {slider}
      {muteBtn}
    </box>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// AudioPopover content — device lists + per-app
// ─────────────────────────────────────────────────────────────────────────────

function AudioPopoverContent() {
  const audio = getAudio()

  // ── Master volume slider ──────────────────────────────────────
  const speaker = audio?.defaultSpeaker

  const masterSlider = new Gtk.Scale({
    orientation: Gtk.Orientation.HORIZONTAL,
    hexpand: true,
    css_classes: ["master-volume-slider"],
    draw_value: false,
    adjustment: new Gtk.Adjustment({
      lower: 0,
      upper: 1.5,
      step_increment: 0.05,
      value: speaker?.volume ?? 0,
    }),
  })
  if (speaker) {
    bind(speaker, "volume").subscribe(v => { masterSlider.value = v })
    masterSlider.connect("value-changed", () => {
      speaker.volume = clamp(masterSlider.value)
    })
  }

  const masterMuteBtn = new Gtk.Button({ css_classes: ["app-mute-btn"] })
  const masterMuteLbl = new Gtk.Label()
  masterMuteBtn.set_child(masterMuteLbl)
  if (speaker) {
    bind(speaker, "mute").subscribe(m => {
      masterMuteLbl.label = m ? "󰖁" : "󰕾"
      masterMuteBtn.css_classes = m ? ["app-mute-btn", "muted"] : ["app-mute-btn"]
    })
    masterMuteBtn.connect("clicked", () => { speaker.mute = !speaker.mute })
  }

  const masterRow = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 8 })
  masterRow.append(new Gtk.Label({ label: "Master", css_classes: ["master-label"], hexpand: false }))
  masterRow.append(masterSlider)
  masterRow.append(masterMuteBtn)

  // ── Output Devices ────────────────────────────────────────────
  const outputBox = new Gtk.Box({
    orientation: Gtk.Orientation.VERTICAL,
    spacing: 4,
    css_classes: ["audio-device-list"],
  })

  // ── Input Devices ─────────────────────────────────────────────
  const inputBox = new Gtk.Box({
    orientation: Gtk.Orientation.VERTICAL,
    spacing: 4,
    css_classes: ["audio-device-list"],
  })

  // ── App streams ───────────────────────────────────────────────
  const appsBox = new Gtk.Box({
    orientation: Gtk.Orientation.VERTICAL,
    spacing: 6,
    css_classes: ["audio-apps-list"],
  })

  // Build device & app lists reactively via notify signals
  function rebuildDevices() {
    // Clear children
    let child = outputBox.get_first_child()
    while (child) { const next = child.get_next_sibling(); outputBox.remove(child); child = next }
    child = inputBox.get_first_child()
    while (child) { const next = child.get_next_sibling(); inputBox.remove(child); child = next }

    if (!audio) return

    // Outputs (sinks)
    const sinks = audio.speakers ?? []
    for (const sink of sinks) {
      outputBox.append(DeviceRow({ endpoint: sink, onSelect: () => { sink.isDefault = true } }))
    }
    if (sinks.length === 0) {
      outputBox.append(new Gtk.Label({ label: "No output devices", css_classes: ["audio-empty"] }))
    }

    // Inputs (sources — exclude monitors)
    const sources = audio.microphones?.filter((e: any) =>
      !e.description?.includes("Monitor")
    ) ?? []
    for (const src of sources) {
      inputBox.append(DeviceRow({ endpoint: src, onSelect: () => { src.isDefault = true } }))
    }
    if (sources.length === 0) {
      inputBox.append(new Gtk.Label({ label: "No input devices", css_classes: ["audio-empty"] }))
    }
  }

  function rebuildApps() {
    let child = appsBox.get_first_child()
    while (child) { const next = child.get_next_sibling(); appsBox.remove(child); child = next }

    if (!audio) return

    const streams = audio.streams ?? []

    for (const s of streams) {
      appsBox.append(AppRow({ stream: s }))
    }
    if (streams.length === 0) {
      appsBox.append(new Gtk.Label({ label: "No active streams", css_classes: ["audio-empty"] }))
    }
  }

  rebuildDevices()
  rebuildApps()

  if (audio) {
    // Rebuild on topology change
    audio.connect("notify::speakers", () => rebuildDevices())
    audio.connect("notify::microphones", () => rebuildDevices())
    audio.connect("notify::streams", () => rebuildApps())
  }

  // ── Layout ────────────────────────────────────────────────────
  const scroll = new Gtk.ScrolledWindow({
    hscrollbar_policy: Gtk.PolicyType.NEVER,
    vscrollbar_policy: Gtk.PolicyType.AUTOMATIC,
    min_content_height: 80,
    max_content_height: 320,
  })

  const inner = new Gtk.Box({
    orientation: Gtk.Orientation.VERTICAL,
    spacing: 12,
    css_classes: ["audio-popup-inner"],
  })

  // Section: Master
  inner.append(new Gtk.Label({ label: "VOLUME", css_classes: ["audio-section-title"], halign: Gtk.Align.START }))
  inner.append(masterRow)

  // Separator
  inner.append(new Gtk.Separator({ orientation: Gtk.Orientation.HORIZONTAL, css_classes: ["audio-sep"] }))

  // Section: Outputs
  inner.append(new Gtk.Label({ label: "OUTPUT", css_classes: ["audio-section-title"], halign: Gtk.Align.START }))
  inner.append(outputBox)

  // Section: Inputs
  inner.append(new Gtk.Separator({ orientation: Gtk.Orientation.HORIZONTAL, css_classes: ["audio-sep"] }))
  inner.append(new Gtk.Label({ label: "INPUT", css_classes: ["audio-section-title"], halign: Gtk.Align.START }))
  inner.append(inputBox)

  // Section: Apps
  inner.append(new Gtk.Separator({ orientation: Gtk.Orientation.HORIZONTAL, css_classes: ["audio-sep"] }))
  inner.append(new Gtk.Label({ label: "APPS", css_classes: ["audio-section-title"], halign: Gtk.Align.START }))
  inner.append(appsBox)

  scroll.set_child(inner)

  const root = new Gtk.Box({
    orientation: Gtk.Orientation.VERTICAL,
    css_classes: ["audio-popup", "generic-widget-content"],
    spacing: 0,
  })
  root.append(scroll)
  return root
}

// ─────────────────────────────────────────────────────────────────────────────
// VolumeButton — bar widget
// ─────────────────────────────────────────────────────────────────────────────

export function VolumeButton({ id }: { id: number }) {
  const audio = getAudio()
  const speaker = audio?.defaultSpeaker

  // Dynamic icon label reacts to volume + mute changes
  const iconLabel = new Gtk.Label({ css_classes: ["volume-icon"] })

  function updateIcon() {
    if (!speaker) { iconLabel.label = "󰖁"; return }
    iconLabel.label = volumeIcon(speaker.volume, speaker.mute)
  }
  updateIcon()

  if (speaker) {
    bind(speaker, "volume").subscribe(() => updateIcon())
    bind(speaker, "mute").subscribe(() => updateIcon())
  }

  // Popover
  const popover = new Gtk.Popover()
  popover.set_has_arrow(false)
  popover.set_css_classes(["transparent-popover"])
  popover.set_child(AudioPopoverContent())

  // Scroll controller
  const scroll = new Gtk.EventControllerScroll()
  scroll.flags = Gtk.EventControllerScrollFlags.BOTH_AXES | Gtk.EventControllerScrollFlags.DISCRETE

  scroll.connect("scroll", (_self: any, _dx: number, dy: number) => {
    if (!speaker) return
    const delta = dy > 0 ? -0.05 : 0.05
    speaker.volume = clamp(speaker.volume + delta)
    playVolumeSound()
    showVolumeOSD()
    return true
  })

  const btn = (
    <menubutton
      cssClasses={["volume-btn"]}
      tooltipText="Audio"
      popover={popover}
    >
      {iconLabel}
    </menubutton>
  )

  ;(btn as any).add_controller(scroll)
  return btn
}
