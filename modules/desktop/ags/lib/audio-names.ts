// Maps PipeWire `application.process.binary` → { name, icon }
// The binary name comes from the `application.process.binary` PulseAudio prop.
// Unknown binaries fall back to application.name (which is often already readable).

export interface AppInfo {
  name: string
  icon: string
}

const BINARY_MAP: Record<string, AppInfo> = {
  // Communication
  ".discord-wrapped":     { name: "Discord",       icon: "🎮" },
  "discord":              { name: "Discord",        icon: "🎮" },
  ".discord-ptb-wrapped": { name: "Discord PTB",   icon: "🎮" },
  "vesktop":              { name: "Vesktop",        icon: "🎮" },

  // Browsers
  "firefox":              { name: "Firefox",        icon: "🦊" },
  ".firefox-wrapped":     { name: "Firefox",        icon: "🦊" },
  "chromium":             { name: "Chromium",       icon: "🌐" },
  "google-chrome":        { name: "Chrome",         icon: "🌐" },
  "brave":                { name: "Brave",          icon: "🌐" },
  "microsoft-edge":       { name: "Edge",           icon: "🌐" },

  // Media
  "spotify":              { name: "Spotify",        icon: "🎵" },
  ".spotify-wrapped":     { name: "Spotify",        icon: "🎵" },
  "mpv":                  { name: "mpv",            icon: "🎬" },
  "vlc":                  { name: "VLC",            icon: "📺" },
  "rhythmbox":            { name: "Rhythmbox",      icon: "🎵" },
  "lollypop":             { name: "Lollypop",       icon: "🎵" },
  "clementine":           { name: "Clementine",     icon: "🎵" },
  "audacious":            { name: "Audacious",      icon: "🎵" },

  // Games / Launchers
  "steam":                { name: "Steam",          icon: "🕹️" },
  "lutris":               { name: "Lutris",         icon: "🕹️" },
  "heroic":               { name: "Heroic",         icon: "🕹️" },

  // Communication
  "telegram-desktop":     { name: "Telegram",       icon: "✈️" },
  "signal-desktop":       { name: "Signal",         icon: "🔒" },

  // Creative
  "obs":                  { name: "OBS Studio",     icon: "📹" },
  "audacity":             { name: "Audacity",       icon: "🎚️" },
  "ardour":               { name: "Ardour",         icon: "🎛️" },

  // Terminals / Misc
  "pipewire":             { name: "PipeWire",       icon: "🔊" },
  "paplay":               { name: "System Sound",   icon: "🔔" },
}

/**
 * Resolves a PipeWire stream to a friendly AppInfo.
 * @param binary  application.process.binary property value
 * @param appName application.name property value (fallback label)
 */
export function resolveAppInfo(binary: string, appName: string): AppInfo {
  const normalised = binary.toLowerCase().replace(/^\./, ".").trim()

  // Try exact match first, then prefix match for wrapped binaries
  if (BINARY_MAP[normalised]) return BINARY_MAP[normalised]

  // Strip leading dot and try again (e.g. ".Discord-wrapped" → "discord-wrapped")
  const stripped = normalised.replace(/^\./, "").replace(/-wrapped$/, "")
  for (const [key, info] of Object.entries(BINARY_MAP)) {
    if (stripped === key.replace(/^\./, "").replace(/-wrapped$/, "")) return info
  }

  // Fall back to application.name with generic icon
  if (appName && appName.trim()) {
    return { name: appName.trim(), icon: "🔊" }
  }

  return { name: binary || "Unknown", icon: "🔊" }
}
