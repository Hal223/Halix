import { Gtk } from "ags/gtk4"
import { createBinding as bind } from "ags"
import GLib from "gi://GLib"
import AstalNetwork from "gi://AstalNetwork"
import AstalBluetooth from "gi://AstalBluetooth"

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getNetwork() {
  try { return AstalNetwork.get_default() } catch { return null }
}

function getBluetooth() {
  try { return AstalBluetooth.get_default() } catch { return null }
}

function clearBox(box: Gtk.Box) {
  let child = box.get_first_child()
  while (child) {
    box.remove(child)
    child = box.get_first_child()
  }
}

// Nerd-font icons for wifi strength
function wifiIcon(strength: number, enabled: boolean, connected: boolean): string {
  if (!enabled) return "󰖪"   // disabled
  if (!connected) return "󰖭"  // offline
  if (strength >= 80) return "󰤨" // excellent
  if (strength >= 60) return "󰤥" // good
  if (strength >= 40) return "󰤢" // ok
  if (strength >= 20) return "󰤟" // weak
  return "󰤯"                     // none
}

function wiredIcon(connected: boolean): string {
  return connected ? "󰈀" : "󰈂"
}

function btIcon(powered: boolean, connected: boolean): string {
  if (!powered) return "󰂲"
  if (connected) return "󰂱"
  return "󰂯"
}

// ─────────────────────────────────────────────────────────────────────────────
// Wifi Access Point Row
// ─────────────────────────────────────────────────────────────────────────────

function ApRow({ ap, wifi }: { ap: any; wifi: any }) {
  const isActive = ap === wifi.activeAccessPoint

  const strengthIcon = new Gtk.Label({
    css_classes: ["net-device-icon"],
    label: wifiIcon(ap.strength ?? 0, true, true),
  })
  bind(ap, "strength").subscribe(() => {
    strengthIcon.label = wifiIcon(ap.strength ?? 0, true, true)
  })

  const ssidLabel = new Gtk.Label({
    css_classes: ["net-device-name"],
    label: ap.ssid || "Hidden Network",
    ellipsize: 3,
    max_width_chars: 22,
    halign: Gtk.Align.START,
    hexpand: true,
  })

  const pctLabel = new Gtk.Label({
    css_classes: ["net-signal-pct"],
    label: `${ap.strength ?? 0}%`,
    halign: Gtk.Align.END,
  })

  const row = new Gtk.Box({
    orientation: Gtk.Orientation.HORIZONTAL,
    spacing: 8,
    css_classes: isActive ? ["net-device-row", "active"] : ["net-device-row"],
  })
  row.append(strengthIcon)
  row.append(ssidLabel)
  row.append(pctLabel)

  const btn = new Gtk.Button({ hexpand: true, css_classes: [] })
  btn.set_child(row)
  btn.add_css_class("net-ap-btn")
  if (isActive) btn.add_css_class("active")

  btn.connect("clicked", () => {
    // Activate connection — use nmcli as a subprocess for simplicity
    if (ap.ssid) {
      GLib.spawn_command_line_async(`nmcli device wifi connect "${ap.ssid}"`)
    }
  })

  return btn
}

// ─────────────────────────────────────────────────────────────────────────────
// Bluetooth Device Row
// ─────────────────────────────────────────────────────────────────────────────

function BtDeviceRow({ device }: { device: any }) {
  const iconLabel = new Gtk.Label({
    css_classes: ["net-device-icon"],
    label: device.connected ? "󰂱" : "󰂯",
  })

  const nameLabel = new Gtk.Label({
    css_classes: ["net-device-name"],
    label: device.alias || device.name || device.address || "Unknown",
    ellipsize: 3,
    max_width_chars: 20,
    halign: Gtk.Align.START,
    hexpand: true,
  })

  // Connect / Disconnect button
  const actionLbl = new Gtk.Label({ label: device.connected ? "Disconnect" : "Connect" })
  const actionBtn = new Gtk.Button({ css_classes: ["net-bt-action-btn"] })
  actionBtn.set_child(actionLbl)
  if (device.connected) actionBtn.add_css_class("connected")

  actionBtn.connect("clicked", () => {
    if (device.connected) {
      device.disconnect_device()
    } else {
      device.connect_device()
    }
  })

  // Update on changes
  const update = () => {
    iconLabel.label = device.connected ? "󰂱" : "󰂯"
    actionLbl.label = device.connected ? "Disconnect" : "Connect"
    if (device.connected) {
      actionBtn.add_css_class("connected")
    } else {
      actionBtn.remove_css_class("connected")
    }
  }
  try { bind(device, "connected").subscribe(update) } catch { /* some devices may not support */ }

  const row = new Gtk.Box({
    orientation: Gtk.Orientation.HORIZONTAL,
    spacing: 8,
    css_classes: ["net-device-row"],
  })
  row.append(iconLabel)
  row.append(nameLabel)
  row.append(actionBtn)

  return row
}

// ─────────────────────────────────────────────────────────────────────────────
// Network Popover Content
// ─────────────────────────────────────────────────────────────────────────────

function NetworkPopoverContent() {
  const network = getNetwork()
  const bt = getBluetooth()
  const wifi = network?.wifi ?? null
  const wired = network?.wired ?? null

  // ── Section header helper ─────────────────────────────────────
  function sectionTitle(label: string) {
    return new Gtk.Label({
      label,
      css_classes: ["net-section-title"],
      halign: Gtk.Align.START,
    })
  }

  function sep() {
    return new Gtk.Separator({
      orientation: Gtk.Orientation.HORIZONTAL,
      css_classes: ["audio-sep"],
    })
  }

  // ── Wifi Toggle Row ───────────────────────────────────────────
  const wifiToggle = new Gtk.Switch({
    active: wifi?.enabled ?? false,
    valign: Gtk.Align.CENTER,
  })
  if (wifi) {
    bind(wifi, "enabled").subscribe(() => { wifiToggle.active = wifi.enabled })
    wifiToggle.connect("state-set", (_sw: any, state: boolean) => {
      wifi.enabled = state
      return false
    })
  } else {
    wifiToggle.sensitive = false
  }

  const wifiHeaderBox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 8, hexpand: true })
  wifiHeaderBox.append(new Gtk.Label({ label: "󰖩", css_classes: ["net-section-icon"] }))
  wifiHeaderBox.append(sectionTitle("Wi-Fi"))
  const wifiHeaderSpacer = new Gtk.Box({ hexpand: true })
  wifiHeaderBox.append(wifiHeaderSpacer)
  wifiHeaderBox.append(wifiToggle)

  // ── Ethernet Toggle Row ───────────────────────────────────────
  const ethIcon = new Gtk.Label({ label: wiredIcon(wired?.internet === 0), css_classes: ["net-section-icon"] })
  const ethHeaderBox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 8, hexpand: true })
  ethHeaderBox.append(ethIcon)
  ethHeaderBox.append(sectionTitle("Ethernet"))
  const ethStatus = new Gtk.Label({
    css_classes: ["net-status-badge"],
    halign: Gtk.Align.END,
    hexpand: true,
  })
  if (wired) {
    const updateEth = () => {
      const connected = wired.internet === 0 // Internet.CONNECTED = 0
      ethIcon.label = wiredIcon(connected)
      ethStatus.label = connected ? "Connected" : "Disconnected"
      ethStatus.css_classes = connected
        ? ["net-status-badge", "connected"]
        : ["net-status-badge", "disconnected"]
    }
    try { bind(wired, "internet").subscribe(updateEth) } catch { /* fallback */ }
    updateEth()
  } else {
    ethStatus.label = "No adapter"
    ethStatus.css_classes = ["net-status-badge", "disconnected"]
  }
  ethHeaderBox.append(ethStatus)

  // ── Wifi Access Points ────────────────────────────────────────
  const apBox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 2, css_classes: ["net-ap-list"] })

  const rebuildAps = () => {
    clearBox(apBox)
    if (!wifi || !wifi.enabled) {
      apBox.append(new Gtk.Label({ label: "Wireless disabled", css_classes: ["net-empty"] }))
      return
    }
    const aps: any[] = Array.from(wifi.accessPoints ?? [])
    // Deduplicate by SSID, prefer stronger signal, exclude hidden (empty ssid)
    const seen = new Map<string, any>()
    for (const ap of aps) {
      const ssid = ap.ssid || ""
      if (!ssid) continue
      const existing = seen.get(ssid)
      if (!existing || (ap.strength ?? 0) > (existing.strength ?? 0)) {
        seen.set(ssid, ap)
      }
    }
    const unique = Array.from(seen.values()).sort((a, b) => (b.strength ?? 0) - (a.strength ?? 0))
    if (unique.length === 0) {
      apBox.append(new Gtk.Label({ label: "No networks found", css_classes: ["net-empty"] }))
    } else {
      unique.slice(0, 8).forEach(ap => apBox.append(ApRow({ ap, wifi })))
    }
  }

  let apRevealer: Gtk.Revealer | null = null
  let apRevealerVisible = false

  if (wifi) {
    apRevealer = new Gtk.Revealer({
      transitionType: Gtk.RevealerTransitionType.SLIDE_DOWN,
      revealChild: false,
    })
    apRevealer.set_child(apBox)
    rebuildAps()

    try { bind(wifi, "accessPoints").subscribe(rebuildAps) } catch { /* may not be available */ }
    bind(wifi, "enabled").subscribe(rebuildAps)
  }

  // Scan button
  const scanBtn = new Gtk.Button({ css_classes: ["net-scan-btn"] })
  const scanLbl = new Gtk.Label({ label: "󰑐 Scan" })
  scanBtn.set_child(scanLbl)
  if (wifi) {
    bind(wifi, "scanning").subscribe(() => {
      scanLbl.label = wifi.scanning ? "Scanning…" : "󰑐 Scan"
      scanBtn.sensitive = !wifi.scanning
    })
    scanBtn.connect("clicked", () => { wifi.scan() })
  } else {
    scanBtn.sensitive = false
  }

  // Toggle AP list visibility
  const wifiExpandIcon = new Gtk.Label({ label: "󰅂" })
  const wifiExpandBtn = new Gtk.Button({ css_classes: ["net-expand-btn"] })
  wifiExpandBtn.set_child(wifiExpandIcon)
  wifiExpandBtn.connect("clicked", () => {
    apRevealerVisible = !apRevealerVisible
    wifiExpandIcon.label = apRevealerVisible ? "󰅁" : "󰅂"
    if (apRevealer) apRevealer.revealChild = apRevealerVisible
  })
  wifiHeaderBox.append(wifiExpandBtn)

  // ── Bluetooth Toggle ──────────────────────────────────────────
  const btToggle = new Gtk.Switch({
    active: bt?.isPowered ?? false,
    valign: Gtk.Align.CENTER,
  })
  if (bt) {
    bind(bt, "isPowered").subscribe(() => { btToggle.active = bt.isPowered })
    btToggle.connect("state-set", (_sw: any, state: boolean) => {
      try { bt.adapter && (bt.adapter.powered = state) } catch { /* no adapter */ }
      return false
    })
  } else {
    btToggle.sensitive = false
  }

  const btHeaderBox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 8, hexpand: true })
  btHeaderBox.append(new Gtk.Label({ label: "󰂯", css_classes: ["net-section-icon"] }))
  btHeaderBox.append(sectionTitle("Bluetooth"))
  const btHeaderSpacer = new Gtk.Box({ hexpand: true })
  btHeaderBox.append(btHeaderSpacer)
  btHeaderBox.append(btToggle)

  // BT device list (paired / connected)
  const btBox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 4, css_classes: ["net-bt-list"] })
  let btRevealer: Gtk.Revealer | null = null
  let btRevealerVisible = false

  const rebuildBt = () => {
    clearBox(btBox)
    if (!bt || !bt.isPowered) {
      btBox.append(new Gtk.Label({ label: "Bluetooth is off", css_classes: ["net-empty"] }))
      return
    }
    const devices: any[] = Array.from(bt.devices ?? []).filter((d: any) => d.paired || d.connected)
    if (devices.length === 0) {
      btBox.append(new Gtk.Label({ label: "No paired devices", css_classes: ["net-empty"] }))
    } else {
      devices.forEach(d => btBox.append(BtDeviceRow({ device: d })))
    }
  }

  if (bt) {
    btRevealer = new Gtk.Revealer({
      transitionType: Gtk.RevealerTransitionType.SLIDE_DOWN,
      revealChild: false,
    })
    btRevealer.set_child(btBox)
    rebuildBt()

    try { bind(bt, "devices").subscribe(rebuildBt) } catch { /* may not be available */ }
    try { bind(bt, "isPowered").subscribe(rebuildBt) } catch { /* fallback */ }
  }

  const btExpandIcon = new Gtk.Label({ label: "󰅂" })
  const btExpandBtn = new Gtk.Button({ css_classes: ["net-expand-btn"] })
  btExpandBtn.set_child(btExpandIcon)
  btExpandBtn.connect("clicked", () => {
    btRevealerVisible = !btRevealerVisible
    btExpandIcon.label = btRevealerVisible ? "󰅁" : "󰅂"
    if (btRevealer) btRevealer.revealChild = btRevealerVisible
  })
  btHeaderBox.append(btExpandBtn)

  // ── Layout ────────────────────────────────────────────────────
  const inner = new Gtk.Box({
    orientation: Gtk.Orientation.VERTICAL,
    spacing: 12,
    css_classes: ["net-popup-inner"],
  })

  // Wifi section
  inner.append(wifiHeaderBox)
  const wifiBtnRow = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 4, halign: Gtk.Align.END })
  wifiBtnRow.append(scanBtn)
  inner.append(wifiBtnRow)
  if (apRevealer) inner.append(apRevealer)

  inner.append(sep())

  // Ethernet section
  inner.append(ethHeaderBox)

  inner.append(sep())

  // Bluetooth section
  inner.append(btHeaderBox)
  if (btRevealer) inner.append(btRevealer)

  const scroll = new Gtk.ScrolledWindow({
    hscrollbar_policy: Gtk.PolicyType.NEVER,
    vscrollbar_policy: Gtk.PolicyType.AUTOMATIC,
    min_content_width: 320,
    max_content_width: 320,
    min_content_height: 200,
    max_content_height: 520,
  })
  scroll.set_child(inner)

  const root = new Gtk.Box({
    orientation: Gtk.Orientation.VERTICAL,
    css_classes: ["net-popup", "generic-widget-content"],
    spacing: 0,
  })
  root.append(scroll)
  return root
}

// ─────────────────────────────────────────────────────────────────────────────
// NetworkButton — bar widget
// ─────────────────────────────────────────────────────────────────────────────

export function NetworkButton({ id: _id }: { id: number }) {
  const network = getNetwork()
  const bt = getBluetooth()
  const wifi = network?.wifi ?? null

  const iconLabel = new Gtk.Label({ css_classes: ["net-bar-icon"] })

  function updateIcon() {
    const primary = network?.primary ?? null
    // primary: 0 = UNKNOWN, 1 = WIRED, 2 = WIFI
    if (primary === 1) {
      iconLabel.label = wiredIcon(true)
      return
    }
    if (wifi) {
      iconLabel.label = wifiIcon(wifi.strength ?? 0, wifi.enabled ?? false, wifi.internet === 0)
      return
    }
    iconLabel.label = "󰖭" // no network
  }
  updateIcon()

  if (network) {
    try { bind(network, "primary").subscribe(updateIcon) } catch { /* ok */ }
  }
  if (wifi) {
    try { bind(wifi, "strength").subscribe(updateIcon) } catch { /* ok */ }
    try { bind(wifi, "internet").subscribe(updateIcon) } catch { /* ok */ }
    try { bind(wifi, "enabled").subscribe(updateIcon) } catch { /* ok */ }
  }

  // Bluetooth indicator dot
  const btDot = new Gtk.Label({ css_classes: ["net-bt-dot"] })
  const updateBtDot = () => {
    if (!bt) { btDot.label = ""; return }
    btDot.label = bt.isPowered ? (bt.isConnected ? "󰂱" : "󰂯") : ""
    btDot.css_classes = bt.isConnected
      ? ["net-bt-dot", "connected"]
      : ["net-bt-dot"]
  }
  updateBtDot()
  if (bt) {
    try { bind(bt, "isPowered").subscribe(updateBtDot) } catch { /* ok */ }
    try { bind(bt, "isConnected").subscribe(updateBtDot) } catch { /* ok */ }
  }

  const iconBox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 2 })
  iconBox.append(iconLabel)
  iconBox.append(btDot)

  const popover = new Gtk.Popover()
  popover.set_has_arrow(false)
  popover.set_css_classes(["transparent-popover"])
  popover.set_child(NetworkPopoverContent())

  const btn = (
    <menubutton
      cssClasses={["net-btn"]}
      tooltipText="Network & Bluetooth"
      popover={popover}
    >
      {iconBox}
    </menubutton>
  )

  return btn
}
