/**
 * Haptic feedback (Vibration API).
 *
 * Fires only on touch-primary devices so a desktop machine never buzzes.
 * Unsupported platforms (notably iOS Safari, which exposes no web vibration
 * API) silently no-op — callers never need to feature-detect.
 */

export type HapticPattern =
  | "selection" // moving between tabs / options
  | "bubble" // tight, springy tap — nav bubbles, chips, carousel dots
  | "light" // ordinary tap
  | "medium" // committing an action
  | "heavy" // starting/stopping a recording
  | "success"
  | "warning"
  | "error";

/** Durations in ms; arrays alternate vibrate/pause. */
const PATTERNS: Record<HapticPattern, number | number[]> = {
  selection: 8,
  // Short–gap–shorter: reads as a pop with a bounce rather than one buzz.
  bubble: [9, 22, 5],
  light: 12,
  medium: 20,
  heavy: 32,
  success: [14, 45, 26],
  warning: [18, 60, 18],
  error: [28, 45, 28, 45, 28],
};

const STORAGE_KEY = "medivaani.haptics";
const LEGACY_STORAGE_KEY = "dhanvantari.haptics";

function readPreference(): boolean {
  try {
    const val =
      localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
    return val !== "off";
  } catch {
    return true;
  }
}

let enabled = readPreference();

/** Lets a future settings screen turn haptics off; persisted locally. */
export function setHapticsEnabled(next: boolean): void {
  enabled = next;
  try {
    localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
  } catch {
    // storage unavailable — preference is session-only
  }
}

export function areHapticsEnabled(): boolean {
  return enabled;
}

/** True on phones/tablets: no hover, coarse pointer. */
function isTouchPrimary(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(hover: none) and (pointer: coarse)").matches
  );
}

export function haptic(pattern: HapticPattern = "light"): void {
  if (!enabled) return;
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  if (!isTouchPrimary()) return;
  try {
    navigator.vibrate(PATTERNS[pattern]);
  } catch {
    // some browsers throw when vibration is blocked by policy
  }
}
