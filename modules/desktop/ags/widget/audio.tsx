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

let _soundTimer: number | null = null
function debouncedPlayVolumeSound() {
  if (_soundTimer !== null) {
    GLib.source_remove(_soundTimer)
  }
  _soundTimer = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 100, () => {
    playVolumeSound()
    _soundTimer = null
    return GLib.SOURCE_REMOVE
  })
}

export function VolumeOSD(gdkmonitor: Gdk.Monitor, id: number = 0) {
  // Only create OSD on primary monitor (id 0)
  if (id !== 0) return null

  // Expose setter to the module-level showVolumeOSD()
  _osdSetVolume = (v: number, m: boolean) => {
    iconLabel.label = volumeIcon(v, m)
    pctLabel.label = m ? "Muted" : `${Math.round(v * 100)}%`
    bar.fraction = Math.min(1, v)
  }

  // Large icon
  const iconLabel = new Gtk.Label({
    css_classes: ["osd-icon"],
    halign: Gtk.Align.CENTER,
  })

  // Percentage text
  const pctLabel = new Gtk.Label({
    css_classes: ["osd-percentage"],
    halign: Gtk.Align.CENTER,
  })

  // Progress bar
  const bar = new Gtk.ProgressBar({
    css_classes: ["osd-bar"],
    hexpand: true,
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
    >
      {content}
    </window>
  )

  _osdWindow = win as unknown as Gtk.Window

  // Global watcher for external volume/mute changes
  const audio = getAudio()
  const speaker = audio?.defaultSpeaker
  if (speaker) {
    let lastVol = speaker.volume
    let lastMute = speaker.mute
    bind(speaker, "volume").subscribe(() => {
      if (speaker.volume !== lastVol) {
        lastVol = speaker.volume
        showVolumeOSD()
        debouncedPlayVolumeSound()
      }
    })
    bind(speaker, "mute").subscribe(() => {
      if (speaker.mute !== lastMute) {
        lastMute = speaker.mute
        showVolumeOSD()
        debouncedPlayVolumeSound()
      }
    })
  }

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
  const iconLabel = new Gtk.Label({ css_classes: ["audio-device-icon"] })
  bind(endpoint, "is-default").subscribe(() => { 
    iconLabel.label = (endpoint.isDefault ?? false) ? "󰓃" : "󰓄" 
  })
  iconLabel.label = (endpoint.isDefault ?? false) ? "󰓃" : "󰓄"

  const nameLabel = new Gtk.Label({
    css_classes: ["audio-device-name"],
    ellipsize: 3,
    max_width_chars: 28,
    halign: Gtk.Align.START,
  })
  bind(endpoint, "description").subscribe(() => { 
    nameLabel.label = endpoint.description?.replace(/\s+\(.+?\)\s*$/, "") ?? "Unknown Device"
  })
  nameLabel.label = endpoint.description?.replace(/\s+\(.+?\)\s*$/, "") ?? "Unknown Device"

  const box = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 8, halign: Gtk.Align.START })
  box.append(iconLabel)
  box.append(nameLabel)

  const btn = new Gtk.Button({ halign: Gtk.Align.FILL, hexpand: true })
  bind(endpoint, "is-default").subscribe(() => {
    btn.css_classes = ["audio-device-row", ...((endpoint.isDefault ?? false) ? ["active"] : [])]
  })
  btn.css_classes = ["audio-device-row", ...((endpoint.isDefault ?? false) ? ["active"] : [])]
  
  btn.connect("clicked", onSelect)
  btn.set_child(box)

  return btn
}

// ─────────────────────────────────────────────────────────────────────────────
// AppRow — per-application sink-input with slider + mute
// ─────────────────────────────────────────────────────────────────────────────

function AppRow({ stream }: { stream: any /* AstalWp.Endpoint */ }) {
  const nameProp = stream.name ?? stream.description ?? ""
  const { name, icon } = resolveAppInfo(nameProp, nameProp)

  const slider = new Gtk.Scale({
    orientation: Gtk.Orientation.HORIZONTAL,
    hexpand: true,
    css_classes: ["app-volume-slider"],
    draw_value: false,
    adjustment: new Gtk.Adjustment({
      lower: 0,
      upper: 1,
      step_increment: 0.05,
      value: stream.volume ?? 0.5,
    }),
  })

  bind(stream, "volume").subscribe(() => { slider.set_value(stream.volume ?? 0.5) })
  slider.connect("value-changed", () => {
    stream.volume = clamp(slider.get_value())
  })

  const muteLbl = new Gtk.Label()
  const muteBtn = new Gtk.Button()
  muteBtn.set_child(muteLbl)

  const updateMute = () => {
    const isMuted = stream.mute ?? false
    muteBtn.css_classes = ["app-mute-btn", ...(isMuted ? ["muted"] : [])]
    muteBtn.tooltip_text = isMuted ? "Unmute" : "Mute"
    muteLbl.label = isMuted ? "󰖁" : "󰕾"
  }
  bind(stream, "mute").subscribe(updateMute)
  updateMute()

  muteBtn.connect("clicked", () => { stream.mute = !(stream.mute ?? false) })

  const box = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 8, hexpand: true, css_classes: ["audio-app-row"] })
  box.append(new Gtk.Label({ css_classes: ["app-icon"], label: icon }))
  box.append(new Gtk.Label({
    css_classes: ["app-name"],
    label: name,
    ellipsize: 3,
    max_width_chars: 14,
    halign: Gtk.Align.START,
  }))
  box.append(slider)
  box.append(muteBtn)

  return box
}

function clearBox(box: Gtk.Box) {
  let child = box.get_first_child()
  while (child) {
    box.remove(child)
    child = box.get_first_child()
  }
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
    bind(speaker, "volume").subscribe(() => { masterSlider.set_value(speaker.volume ?? 0) })
    masterSlider.connect("value-changed", () => {
      speaker.volume = clamp(masterSlider.get_value())
    })
  }

  const masterMuteBtn = new Gtk.Button({ css_classes: ["app-mute-btn"] })
  const masterMuteLbl = new Gtk.Label()
  masterMuteBtn.set_child(masterMuteLbl)
  if (speaker) {
    bind(speaker, "mute").subscribe(() => {
      const isMuted = speaker.mute ?? false
      masterMuteLbl.label = isMuted ? "󰖁" : "󰕾"
      masterMuteBtn.css_classes = isMuted ? ["app-mute-btn", "muted"] : ["app-mute-btn"]
    })
    masterMuteBtn.connect("clicked", () => { speaker.mute = !(speaker.mute ?? false) })
  }

  const masterRow = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 8 })
  masterRow.append(new Gtk.Label({ label: "Master", css_classes: ["master-label"], hexpand: false }))
  masterRow.append(masterSlider)
  masterRow.append(masterMuteBtn)

  // ── Output Devices ────────────────────────────────────────────
  const outputBox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 4, css_classes: ["audio-device-list"] })
  if (audio) {
    const updateOutputs = () => {
      clearBox(outputBox)
      const sinks = audio.speakers ?? []
      if (sinks.length > 0) {
        sinks.forEach((sink: any) => outputBox.append(DeviceRow({ endpoint: sink, onSelect: () => { sink.isDefault = true } })))
      } else {
        outputBox.append(new Gtk.Label({ label: "No output devices", css_classes: ["audio-empty"] }))
      }
    }
    bind(audio, "speakers").subscribe(updateOutputs)
    updateOutputs()
  } else {
    outputBox.append(new Gtk.Label({ label: "No output devices", css_classes: ["audio-empty"] }))
  }

  // ── Input Devices ─────────────────────────────────────────────
  const inputBox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 4, css_classes: ["audio-device-list"] })
  if (audio) {
    const updateInputs = () => {
      clearBox(inputBox)
      const sources = (audio.microphones ?? []).filter((e: any) => !e.description?.includes("Monitor"))
      if (sources.length > 0) {
        sources.forEach((src: any) => inputBox.append(DeviceRow({ endpoint: src, onSelect: () => { src.isDefault = true } })))
      } else {
        inputBox.append(new Gtk.Label({ label: "No input devices", css_classes: ["audio-empty"] }))
      }
    }
    bind(audio, "microphones").subscribe(updateInputs)
    updateInputs()
  } else {
    inputBox.append(new Gtk.Label({ label: "No input devices", css_classes: ["audio-empty"] }))
  }

  // ── App streams ───────────────────────────────────────────────
  const appsBox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 6, css_classes: ["audio-apps-list"] })
  if (audio) {
    const updateStreams = () => {
      clearBox(appsBox)
      const streams = audio.streams ?? []
      if (streams.length > 0) {
        streams.forEach((s: any) => appsBox.append(AppRow({ stream: s })))
      } else {
        appsBox.append(new Gtk.Label({ label: "No active streams", css_classes: ["audio-empty"] }))
      }
    }
    bind(audio, "streams").subscribe(updateStreams)
    updateStreams()
  } else {
    appsBox.append(new Gtk.Label({ label: "No active streams", css_classes: ["audio-empty"] }))
  }

  // ── Layout ────────────────────────────────────────────────────
  const scroll = new Gtk.ScrolledWindow({
    hscrollbar_policy: Gtk.PolicyType.NEVER,
    vscrollbar_policy: Gtk.PolicyType.AUTOMATIC,
    min_content_width: 350,
    max_content_width: 350,
    min_content_height: 450,
    max_content_height: 600,
  })

  const inner = new Gtk.Box({
    orientation: Gtk.Orientation.VERTICAL,
    spacing: 12,
    css_classes: ["audio-popup-inner"],
  })

  // Section: Master
  inner.append(new Gtk.Label({ label: "VOLUME", css_classes: ["audio-section-title"], halign: Gtk.Align.START }))
  inner.append(masterRow)

  if (audio) {
    // Section: Outputs
    let showOutputs = false
    const outputIcon = new Gtk.Label({ label: "󰅂" })
    const outputRevealer = new Gtk.Revealer({
      transitionType: Gtk.RevealerTransitionType.SLIDE_DOWN,
      revealChild: false,
    })
    outputRevealer.set_child(outputBox as Gtk.Widget)

    const defaultOutputDesc = bind(audio, "defaultSpeaker").as(s => s?.description ?? "Select Output")
    const outputBtn = (
      <button cssClasses={["audio-selector-btn"]} onClicked={() => {
        showOutputs = !showOutputs
        outputIcon.label = showOutputs ? "󰅁" : "󰅂"
        outputRevealer.revealChild = showOutputs
      }}>
        <box spacing={8}>
          <label label="󰓃" cssClasses={["audio-selector-icon"]} />
          <label label={defaultOutputDesc} hexpand halign={Gtk.Align.START} ellipsize={3} maxWidthChars={28} />
          {outputIcon}
        </box>
      </button>
    )

    inner.append(new Gtk.Separator({ orientation: Gtk.Orientation.HORIZONTAL, css_classes: ["audio-sep"] }))
    inner.append(outputBtn as Gtk.Widget)
    inner.append(outputRevealer)

    // Section: Inputs
    let showInputs = false
    const inputIcon = new Gtk.Label({ label: "󰅂" })
    const inputRevealer = new Gtk.Revealer({
      transitionType: Gtk.RevealerTransitionType.SLIDE_DOWN,
      revealChild: false,
    })
    inputRevealer.set_child(inputBox as Gtk.Widget)

    const defaultInputDesc = bind(audio, "defaultMicrophone").as(m => m?.description ?? "Select Input")
    const inputBtn = (
      <button cssClasses={["audio-selector-btn"]} onClicked={() => {
        showInputs = !showInputs
        inputIcon.label = showInputs ? "󰅁" : "󰅂"
        inputRevealer.revealChild = showInputs
      }}>
        <box spacing={8}>
          <label label="󰓄" cssClasses={["audio-selector-icon"]} />
          <label label={defaultInputDesc} hexpand halign={Gtk.Align.START} ellipsize={3} maxWidthChars={28} />
          {inputIcon}
        </box>
      </button>
    )

    inner.append(new Gtk.Separator({ orientation: Gtk.Orientation.HORIZONTAL, css_classes: ["audio-sep"] }))
    inner.append(inputBtn as Gtk.Widget)
    inner.append(inputRevealer)
  }

  // Section: Apps
  inner.append(new Gtk.Separator({ orientation: Gtk.Orientation.HORIZONTAL, css_classes: ["audio-sep"] }))
  inner.append(new Gtk.Label({ label: "APPS", css_classes: ["audio-section-title"], halign: Gtk.Align.START }))
  inner.append(appsBox as Gtk.Widget)

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
    iconLabel.label = volumeIcon(speaker.volume ?? 0, speaker.mute ?? false)
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
