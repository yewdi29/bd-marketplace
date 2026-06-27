/** Step 2 dot map colors */
export const HIW_DOT_GRAY = '#D1D5DB'
export const HIW_DOT_ORANGE = '#FF6B35'

export const HIW_DOT_RADIUS = 1.5
export const HIW_GRID_STEP = 4

/** Per-dot color transition duration (ms). */
export const HIW_DOT_TRANSITION_MS = 300

/** Delay multiplier: distance from center (px) × this value (ms). */
export const HIW_RIPPLE_DELAY_PER_PX = 2

export const HIW_RIPPLE_HOLD_MS = 1500
export const HIW_RIPPLE_FADE_MS = 500

/** Delay after Step 2 activates before Live pill + map ripple (ms). */
export const HIW_RIPPLE_START_DELAY_MS = 1500

/** Map ripple animation duration (ms). */
export const HIW_RIPPLE_DURATION_MS = 900

/** Idle hold after ripple completes, before c2 connector fills (ms). */
export const STEP2_POST_RIPPLE_HOLD_MS = 1000

/**
 * Fixed post-Live duration before c2 connector fills.
 * Ripple duration + post-ripple hold.
 */
export const STEP2_POST_LIVE_MS = HIW_RIPPLE_DURATION_MS + STEP2_POST_RIPPLE_HOLD_MS

export const WORLD_ATLAS_URL =
  'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

/** Step 2 map focus — Americas, Europe, Asia [west, south, east, north]. */
export const HIW_MAP_VIEW_BBOX: [number, number, number, number] = [-168, -42, 152, 58]

/** Inset inside the gray box canvas (matches p-2 padding). */
export const HIW_MAP_PADDING = 8

export type HiWLandDot = { x: number; y: number; dist: number }

export function lerpHiwDotColor(t: number): string {
  const clamped = Math.max(0, Math.min(1, t))
  const r1 = 209
  const g1 = 213
  const b1 = 219
  const r2 = 255
  const g2 = 107
  const b2 = 53
  return `rgb(${Math.round(r1 + (r2 - r1) * clamped)},${Math.round(g1 + (g2 - g1) * clamped)},${Math.round(b1 + (b2 - b1) * clamped)})`
}

/** Ripple progress 0 = gray, 1 = full orange; stays orange after hold until loop reset. */
export function geoRippleProgress(
  elapsedMs: number,
  distFromCenter: number,
  maxDist: number,
): number {
  if (elapsedMs < 0 || maxDist <= 0) return 0

  const dotStart = distFromCenter * HIW_RIPPLE_DELAY_PER_PX
  const allOrangeAt = maxDist * HIW_RIPPLE_DELAY_PER_PX + HIW_DOT_TRANSITION_MS
  const holdEnd = allOrangeAt + HIW_RIPPLE_HOLD_MS

  if (elapsedMs < dotStart) return 0

  if (elapsedMs < allOrangeAt) {
    return Math.min(1, (elapsedMs - dotStart) / HIW_DOT_TRANSITION_MS)
  }

  return 1
}
