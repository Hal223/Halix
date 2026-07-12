import Gio from "gi://Gio"
import GLib from "gi://GLib"

// Candidate sound files in preference order.
// These ship with most Linux systems via the freedesktop sound theme.
const SOUND_CANDIDATES = [
  "/run/current-system/sw/share/sounds/freedesktop/stereo/audio-volume-change.oga",
  "/usr/share/sounds/freedesktop/stereo/audio-volume-change.oga",
  "/usr/share/sounds/freedesktop/stereo/bell.oga",
]

let _soundPath: string | null = undefined as unknown as string | null

function getSoundPath(): string | null {
  if (_soundPath !== undefined) return _soundPath
  for (const p of SOUND_CANDIDATES) {
    if (GLib.file_test(p, GLib.FileTest.EXISTS)) {
      _soundPath = p
      return p
    }
  }
  _soundPath = null
  return null
}

// Debounce — only play once per 150 ms window to avoid rapid-fire on scroll
let _debounceTimer: number | null = null

export function playVolumeSound() {
  if (_debounceTimer !== null) return
  _debounceTimer = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 150, () => {
    _debounceTimer = null
    return GLib.SOURCE_REMOVE
  })

  const path = getSoundPath()
  if (!path) return

  try {
    // paplay is non-blocking and respects the current audio routing
    const proc = Gio.Subprocess.new(
      ["paplay", "--volume=40000", path],
      Gio.SubprocessFlags.NONE,
    )
    // Fire and forget — we don't wait for it
    proc.wait_async(null, null)
  } catch (e) {
    // Non-fatal — sound effect is optional
    console.warn("volume-sound: paplay failed:", e)
  }
}
