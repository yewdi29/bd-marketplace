export interface HeroGlobeLayout {
  size: number
  left: number
  top: number
}

/** Desktop hero globe positioning — matches former COBE layout at ≥1000px. */
export function computeHeroGlobeLayout(w: number, h: number): HeroGlobeLayout {
  const size = Math.max(Math.round(h * 1.2), 960)
  const boundW = Math.min(w, 1280)
  const left = Math.round(Math.max(0, (w - 1280) / 2) + boundW * 0.75 - size / 2)
  return { size, left, top: -70 }
}
