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

function wifiIcon(strength: number, enabled: boolean, connected: boolean): string {
  if (!enabled) return "󰖪"
  if (!connected) return "󰖭"
  if (strength >= 80) return "󰤨"
  if (strength >= 60) return "󰤥"
  if (strength >= 40) return "󰤢"
  if (strength >= 20) return "󰤟"
  return "󰤯"
}

function wiredIcon(connected: boolean): string {
  return connected ? "󰈀" : "󰈂"
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
    pctLabel.label = `${ap.strength ?? 0}%`
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
    css_classes: ["net-device-row"],
  })
  row.append(strengthIcon)
  row.append(ssidLabel)
  row.append(pctLabel)

  const btn = new Gtk.Button({ hexpand: true, css_classes: ["net-ap-btn"] })
  if (isActive) btn.add_css_class("active")
  btn.set_child(row)

  btn.connect("clicked", () => {
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

  const update = () => {
    iconLabel.label = device.connected ? "󰂱" : "󰂯"
    actionLbl.label = device.connected ? "Disconnect" : "Connect"
    if (device.connected) {
      actionBtn.add_css_class("connected")
    } else {
      actionBtn.remove_css_class("connected")
    }
  }
  try { bind(device, "connected").subscribe(update) } catch { /* ok */ }

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

  function sectionTitle(text: string) {
    return new Gtk.Label({
      label: text,
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

  // ── Wifi section ──────────────────────────────────────────────

  // AP list + revealer
  const apBox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 2, css_classes: ["net-ap-list"] })
  let apRevealer: Gtk.Revealer | null = null
  let apRevealerOpen = false

  const rebuildAps = () => {
    clearBox(apBox)
    if (!wifi || !wifi.enabled) {
      apBox.append(new Gtk.Label({ label: "Wireless disabled", css_classes: ["net-empty"] }))
      return
    }
    const aps: any[] = Array.from(wifi.accessPoints ?? [])
    const seen = new Map<string, any>()
    for (const ap of aps) {
      const ssid = ap.ssid || ""
      if (!ssid) continue
      const existing = seen.get(ssid)
      if (!existing || (ap.strength ?? 0) > (existing.strength ?? 0)) seen.set(ssid, ap)
    }
    const unique = Array.from(seen.values()).sort((a, b) => (b.strength ?? 0) - (a.strength ?? 0))
    if (unique.length === 0) {
      apBox.append(new Gtk.Label({ label: "No networks found", css_classes: ["net-empty"] }))
    } else {
      unique.slice(0, 10).forEach(ap => apBox.append(ApRow({ ap, wifi })))
    }
  }

  if (wifi) {
    apRevealer = new Gtk.Revealer({
      transitionType: Gtk.RevealerTransitionType.SLIDE_DOWN,
      revealChild: false,
    })
    apRevealer.set_child(apBox)
    rebuildAps()
    try { bind(wifi, "accessPoints").subscribe(rebuildAps) } catch { /* ok */ }
    bind(wifi, "enabled").subscribe(rebuildAps)
  }

  // Wifi toggle
  const wifiToggle = new Gtk.Switch({ active: wifi?.enabled ?? false, valign: Gtk.Align.CENTER })
  if (wifi) {
    bind(wifi, "enabled").subscribe(() => { wifiToggle.active = wifi.enabled })
    wifiToggle.connect("state-set", (_sw: any, state: boolean) => {
      wifi.enabled = state
      return false
    })
  } else {
    wifiToggle.sensitive = false
  }

  // Wifi scan button (left of toggle)
  const wifiScanLbl = new Gtk.Label({ label: "󰑐 Scan" })
  const wifiScanBtn = new Gtk.Button({ css_classes: ["net-scan-btn"] })
  wifiScanBtn.set_child(wifiScanLbl)
  if (wifi) {
    bind(wifi, "scanning").subscribe(() => {
      wifiScanLbl.label = wifi.scanning ? "Scanning…" : "󰑐 Scan"
      wifiScanBtn.sensitive = !wifi.scanning
    })
    wifiScanBtn.connect("clicked", () => { wifi.scan() })
  } else {
    wifiScanBtn.sensitive = false
  }

  // Wifi expand button (right of toggle)
  const wifiExpandIcon = new Gtk.Label({ label: "󰅂" })
  const wifiExpandBtn = new Gtk.Button({ css_classes: ["net-expand-btn"] })
  wifiExpandBtn.set_child(wifiExpandIcon)
  wifiExpandBtn.connect("clicked", () => {
    apRevealerOpen = !apRevealerOpen
    wifiExpandIcon.label = apRevealerOpen ? "󰅁" : "󰅂"
    if (apRevealer) apRevealer.revealChild = apRevealerOpen
  })

  // Wifi header: [icon] [title hexpand] [scan] [toggle] [expand]
  const wifiHeaderBox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 8, hexpand: true })
  wifiHeaderBox.append(new Gtk.Label({ label: "󰖩", css_classes: ["net-section-icon"] }))
  wifiHeaderBox.append(sectionTitle("Wi-Fi"))
  wifiHeaderBox.append(new Gtk.Box({ hexpand: true })) // spacer
  wifiHeaderBox.append(wifiScanBtn)
  wifiHeaderBox.append(wifiToggle)
  wifiHeaderBox.append(wifiExpandBtn)

  // ── Ethernet section ──────────────────────────────────────────

  const ethIcon = new Gtk.Label({ label: wiredIcon(false), css_classes: ["net-section-icon"] })
  const ethStatus = new Gtk.Label({
    css_classes: ["net-status-badge"],
    halign: Gtk.Align.END,
    hexpand: true,
  })
  if (wired) {
    const updateEth = () => {
      const connected = wired.internet === 0
      ethIcon.label = wiredIcon(connected)
      ethStatus.label = connected ? "Connected" : "Disconnected"
      ethStatus.css_classes = connected
        ? ["net-status-badge", "connected"]
        : ["net-status-badge", "disconnected"]
    }
    try { bind(wired, "internet").subscribe(updateEth) } catch { /* ok */ }
    updateEth()
  } else {
    ethIcon.label = wiredIcon(false)
    ethStatus.label = "No adapter"
    ethStatus.css_classes = ["net-status-badge", "disconnected"]
  }

  const ethHeaderBox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 8, hexpand: true })
  ethHeaderBox.append(ethIcon)
  ethHeaderBox.append(sectionTitle("Ethernet"))
  ethHeaderBox.append(ethStatus)

  // ── Bluetooth section ─────────────────────────────────────────

  const btBox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 4, css_classes: ["net-bt-list"] })
  let btRevealer: Gtk.Revealer | null = null
  let btRevealerOpen = false

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
    try { bind(bt, "devices").subscribe(rebuildBt) } catch { /* ok */ }
    try { bind(bt, "isPowered").subscribe(rebuildBt) } catch { /* ok */ }
  }

  // BT toggle
  const btToggle = new Gtk.Switch({ active: bt?.isPowered ?? false, valign: Gtk.Align.CENTER })
  if (bt) {
    bind(bt, "isPowered").subscribe(() => { btToggle.active = bt.isPowered })
    btToggle.connect("state-set", (_sw: any, state: boolean) => {
      try { if (bt.adapter) bt.adapter.powered = state } catch { /* no adapter */ }
      return false
    })
  } else {
    btToggle.sensitive = false
  }

  // BT scan button (left of toggle) — uses adapter StartDiscovery / StopDiscovery
  const btScanLbl = new Gtk.Label({ label: "󰑐 Scan" })
  const btScanBtn = new Gtk.Button({ css_classes: ["net-scan-btn"] })
  btScanBtn.set_child(btScanLbl)
  if (bt) {
    const updateBtScan = () => {
      const discovering = bt.adapter?.discovering ?? false
      btScanLbl.label = discovering ? "Scanning…" : "󰑐 Scan"
      btScanBtn.sensitive = bt.isPowered
    }
    try { bind(bt, "isPowered").subscribe(updateBtScan) } catch { /* ok */ }
    updateBtScan()

    btScanBtn.connect("clicked", () => {
      try {
        const adapter = bt.adapter
        if (!adapter) return
        if (adapter.discovering) {
          adapter.stop_discovery()
        } else {
          adapter.start_discovery()
          // Auto-stop after 15s
          GLib.timeout_add(GLib.PRIORITY_DEFAULT, 15000, () => {
            try { if (adapter.discovering) adapter.stop_discovery() } catch { /* ok */ }
            btScanLbl.label = "󰑐 Scan"
            return GLib.SOURCE_REMOVE
          })
        }
      } catch { /* ok */ }
    })
  } else {
    btScanBtn.sensitive = false
  }

  // BT expand button
  const btExpandIcon = new Gtk.Label({ label: "󰅂" })
  const btExpandBtn = new Gtk.Button({ css_classes: ["net-expand-btn"] })
  btExpandBtn.set_child(btExpandIcon)
  btExpandBtn.connect("clicked", () => {
    btRevealerOpen = !btRevealerOpen
    btExpandIcon.label = btRevealerOpen ? "󰅁" : "󰅂"
    if (btRevealer) btRevealer.revealChild = btRevealerOpen
  })

  // BT icon (reacts to powered/connected state)
  const btSectionIcon = new Gtk.Label({ css_classes: ["net-section-icon"] })
  const updateBtIcon = () => {
    if (!bt || !bt.isPowered) { btSectionIcon.label = "󰂲"; return }
    btSectionIcon.label = bt.isConnected ? "󰂱" : "󰂯"
  }
  updateBtIcon()
  if (bt) {
    try { bind(bt, "isPowered").subscribe(updateBtIcon) } catch { /* ok */ }
    try { bind(bt, "isConnected").subscribe(updateBtIcon) } catch { /* ok */ }
  }

  // BT header: [icon] [title hexpand] [scan] [toggle] [expand]
  const btHeaderBox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 8, hexpand: true })
  btHeaderBox.append(btSectionIcon)
  btHeaderBox.append(sectionTitle("Bluetooth"))
  btHeaderBox.append(new Gtk.Box({ hexpand: true })) // spacer
  btHeaderBox.append(btScanBtn)
  btHeaderBox.append(btToggle)
  btHeaderBox.append(btExpandBtn)

  // ── Layout ────────────────────────────────────────────────────

  const inner = new Gtk.Box({
    orientation: Gtk.Orientation.VERTICAL,
    spacing: 14,
    css_classes: ["net-popup-inner"],
  })

  inner.append(wifiHeaderBox)
  if (apRevealer) inner.append(apRevealer)

  inner.append(sep())

  inner.append(ethHeaderBox)

  inner.append(sep())

  inner.append(btHeaderBox)
  if (btRevealer) inner.append(btRevealer)

  // No fixed height — let the popup grow with content naturally
  const root = new Gtk.Box({
    orientation: Gtk.Orientation.VERTICAL,
    css_classes: ["net-popup", "generic-widget-content"],
    spacing: 0,
  })
  root.append(inner)
  return root
}

// ─────────────────────────────────────────────────────────────────────────────
// NetworkButton — bar widget
// ─────────────────────────────────────────────────────────────────────────────

export function NetworkButton({ id: _id }: { id: number }) {
  const network = getNetwork()
  const bt = getBluetooth()
  const wifi = network?.wifi ?? null
  const wired = network?.wired ?? null

  // ── Ethernet icon (always visible when adapter exists) ────────────────────
  const ethIcon = new Gtk.Label({ css_classes: ["net-bar-icon"] })
  const updateEth = () => {
    if (!wired) { ethIcon.visible = false; return }
    const connected = wired.internet === 0
    ethIcon.label = wiredIcon(connected)
    ethIcon.visible = true
  }
  updateEth()
  if (wired) try { bind(wired, "internet").subscribe(updateEth) } catch { /* ok */ }

  // ── WiFi icon (visible only when enabled AND connected) ────────────────────
  const wifiIconLbl = new Gtk.Label({ css_classes: ["net-bar-icon"], visible: false })
  const updateWifi = () => {
    if (!wifi || !wifi.enabled || wifi.internet !== 0) {
      wifiIconLbl.visible = false
      return
    }
    wifiIconLbl.label = wifiIcon(wifi.strength ?? 0, true, true)
    wifiIconLbl.visible = true
  }
  updateWifi()
  if (wifi) {
    try { bind(wifi, "enabled").subscribe(updateWifi) } catch { /* ok */ }
    try { bind(wifi, "internet").subscribe(updateWifi) } catch { /* ok */ }
    try { bind(wifi, "strength").subscribe(updateWifi) } catch { /* ok */ }
  }

  // ── BT icon (visible only when powered AND a device is connected) ────────────
  const btIconLbl = new Gtk.Label({ css_classes: ["net-bt-bar-icon"], visible: false })
  const updateBt = () => {
    if (!bt || !bt.isPowered || !bt.isConnected) {
      btIconLbl.visible = false
      return
    }
    btIconLbl.label = "󰂱"
    btIconLbl.css_classes = ["net-bt-bar-icon", "connected"]
    btIconLbl.visible = true
  }
  updateBt()
  if (bt) {
    try { bind(bt, "isPowered").subscribe(updateBt) } catch { /* ok */ }
    try { bind(bt, "isConnected").subscribe(updateBt) } catch { /* ok */ }
  }

  // ── Icon box — only visible children contribute to width ───────────────────────
  const iconBox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 4 })
  iconBox.append(ethIcon)
  iconBox.append(wifiIconLbl)
  iconBox.append(btIconLbl)

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
