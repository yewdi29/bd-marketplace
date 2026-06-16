import { RefObject, useRef, useEffect, useCallback } from 'react'

// Number of points sampled along the perimeter for drawing
const NPTS = 300

export interface GlowBorderOptions {
  /** Half-width of the moving glow arc in perimeter points. Default 60. */
  arcLen?: number
  /** Initial speed burst on focus. Default 1.2. */
  burstSpeed?: number
  /** Settled cruising speed after burst. Default 0.18. */
  settleSpeed?: number
  /** Corner radius of the element in px. Default 100 (pill). */
  borderRadius?: number
  /** Multiplier applied to all shadowBlur spread values. Default 1.0. */
  glowIntensity?: number
}

interface GlowState {
  active: boolean
  opacity: number
  pos: number
  speed: number
  targetSpeed: number
  raf: number | null
}

// ─── Geometry ─────────────────────────────────────────────────────────────────

/**
 * Sample `npts` evenly-spaced points along the perimeter of a rounded rect.
 * Returns coordinates in element-local space (0,0) → (w,h).
 */
function sampleRoundedRect(
  w: number,
  h: number,
  r: number,
  npts: number,
): [number, number][] {
  const R = Math.min(r, w / 2, h / 2)
  const quarterArc = (Math.PI / 2) * R
  const sw = Math.max(0, w - 2 * R) // straight horizontal
  const sh = Math.max(0, h - 2 * R) // straight vertical
  const total = 2 * sw + 2 * sh + 4 * quarterArc
  if (total === 0) return []

  const pts: [number, number][] = []

  for (let i = 0; i < npts; i++) {
    const d = (i / npts) * total
    let acc = 0
    let x = 0
    let y = 0
    let found = false

    // 1. Top edge → right
    if (!found && d < acc + sw) {
      const t = sw > 0 ? (d - acc) / sw : 0
      x = R + t * sw; y = 0; found = true
    }
    acc += sw

    // 2. Top-right arc
    if (!found && d < acc + quarterArc) {
      const t = quarterArc > 0 ? (d - acc) / quarterArc : 0
      const a = -Math.PI / 2 + t * (Math.PI / 2)
      x = (w - R) + R * Math.cos(a); y = R + R * Math.sin(a); found = true
    }
    acc += quarterArc

    // 3. Right edge ↓
    if (!found && d < acc + sh) {
      const t = sh > 0 ? (d - acc) / sh : 0
      x = w; y = R + t * sh; found = true
    }
    acc += sh

    // 4. Bottom-right arc
    if (!found && d < acc + quarterArc) {
      const t = quarterArc > 0 ? (d - acc) / quarterArc : 0
      const a = t * (Math.PI / 2)
      x = (w - R) + R * Math.cos(a); y = (h - R) + R * Math.sin(a); found = true
    }
    acc += quarterArc

    // 5. Bottom edge ← left
    if (!found && d < acc + sw) {
      const t = sw > 0 ? (d - acc) / sw : 0
      x = (w - R) - t * sw; y = h; found = true
    }
    acc += sw

    // 6. Bottom-left arc
    if (!found && d < acc + quarterArc) {
      const t = quarterArc > 0 ? (d - acc) / quarterArc : 0
      const a = Math.PI / 2 + t * (Math.PI / 2)
      x = R + R * Math.cos(a); y = (h - R) + R * Math.sin(a); found = true
    }
    acc += quarterArc

    // 7. Left edge ↑
    if (!found && d < acc + sh) {
      const t = sh > 0 ? (d - acc) / sh : 0
      x = 0; y = (h - R) - t * sh; found = true
    }
    acc += sh

    // 8. Top-left arc (fallthrough / last segment)
    if (!found) {
      const t = quarterArc > 0 ? Math.min((d - acc) / quarterArc, 1) : 0
      const a = Math.PI + t * (Math.PI / 2)
      x = R + R * Math.cos(a); y = R + R * Math.sin(a)
    }

    pts.push([x, y])
  }

  return pts
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Canvas-based animated glow border.
 *
 * Usage:
 *   const canvasRef = useRef<HTMLCanvasElement>(null)
 *   const containerRef = useRef<HTMLDivElement>(null)
 *   const { onFocus, onBlur } = useGlowBorder(canvasRef, containerRef)
 *
 * Place a <canvas ref={canvasRef} style={{ position:'absolute', zIndex:0, pointerEvents:'none' }} />
 * and a <div ref={containerRef} style={{ position:'relative', zIndex:1 }}> inside a position:relative wrapper.
 * Set the container's border to transparent on focus so the canvas border takes over.
 */
export function useGlowBorder<T extends HTMLElement>(
  canvasRef: RefObject<HTMLCanvasElement>,
  containerRef: RefObject<T>,
  options?: GlowBorderOptions,
): { onFocus: () => void; onBlur: () => void } {
  // Keep options always-fresh in a ref so tick never captures stale values
  const optsRef = useRef<Required<GlowBorderOptions>>({
    arcLen: 60,
    burstSpeed: 1.2,
    settleSpeed: 0.18,
    borderRadius: 100,
    glowIntensity: 1.0,
  })
  optsRef.current = {
    arcLen: options?.arcLen ?? 60,
    burstSpeed: options?.burstSpeed ?? 1.2,
    settleSpeed: options?.settleSpeed ?? 0.18,
    borderRadius: options?.borderRadius ?? 100,
    glowIntensity: options?.glowIntensity ?? 1.0,
  }

  const stateRef = useRef<GlowState>({
    active: false,
    opacity: 0,
    pos: 0,
    speed: 0,
    targetSpeed: 0,
    raf: null,
  })

  const ptsRef = useRef<[number, number][]>([])

  // tickRef lets the animation loop self-schedule without stale closure issues
  const tickRef = useRef<() => void>(() => {})

  // ── Size the canvas and recompute perimeter points whenever container resizes ─
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver(() => {
      const canvas = canvasRef.current
      if (!canvas) return

      const w = container.offsetWidth
      const h = container.offsetHeight
      if (w === 0 || h === 0) return

      // Read the actual rendered corner radius from the element itself.
      // Falls back to the options value if the element has no border-radius set.
      const computedR = parseFloat(getComputedStyle(container).borderTopLeftRadius)
      const r = Number.isFinite(computedR) && computedR > 0
        ? computedR
        : optsRef.current.borderRadius

      canvas.width = w + 20
      canvas.height = h + 20
      canvas.style.left = '-10px'
      canvas.style.top = '-10px'
      ptsRef.current = sampleRoundedRect(w, h, r, NPTS)
    })

    observer.observe(container)
    return () => observer.disconnect()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // canvasRef / containerRef are stable ref objects — safe to omit

  // ── Define the animation tick (via ref so self-scheduling is always fresh) ───
  useEffect(() => {
    tickRef.current = () => {
      const st = stateRef.current
      const canvas = canvasRef.current
      const pts = ptsRef.current
      const { arcLen, glowIntensity } = optsRef.current

      // ── Animate state ──────────────────────────────────────────────────────
      st.speed += (st.targetSpeed - st.speed) * 0.03
      st.pos = (st.pos + st.speed + NPTS) % NPTS
      st.opacity = st.active
        ? Math.min(1, st.opacity + 0.05)
        : Math.max(0, st.opacity - 0.03)

      // ── Draw ───────────────────────────────────────────────────────────────
      if (canvas && pts.length > 0) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          const OX = 10 // canvas is 10px larger each side → shift all pts by 10

          ctx.clearRect(0, 0, canvas.width, canvas.height)

          if (st.opacity > 0) {
            // Step 1 — Faint full border outline
            ctx.save()
            ctx.shadowBlur = 0
            ctx.shadowColor = 'transparent'
            ctx.strokeStyle = `rgba(255, 107, 53, ${0.12 * st.opacity})`
            ctx.lineWidth = 1.5
            ctx.beginPath()
            for (let i = 0; i < pts.length; i++) {
              const [px, py] = pts[i]
              if (i === 0) ctx.moveTo(px + OX, py + OX)
              else ctx.lineTo(px + OX, py + OX)
            }
            ctx.closePath()
            ctx.stroke()
            ctx.restore()

            // Step 2 — Moving glow arc
            const halfArc = arcLen / 2
            const posInt = Math.floor(st.pos)

            for (let i = -halfArc; i <= halfArc; i++) {
              const idx = ((posInt + Math.round(i)) % NPTS + NPTS) % NPTS
              const [px, py] = pts[idx]
              const falloff = Math.pow(1 - Math.abs(i) / halfArc, 2.2)
              if (falloff < 0.01) continue

              const nextIdx = (idx + 1) % NPTS
              const [nx, ny] = pts[nextIdx]

              // Outer glow pass
              ctx.save()
              ctx.shadowBlur = 10 * falloff * glowIntensity
              ctx.shadowColor = `rgba(255, 120, 60, ${0.9 * falloff * st.opacity})`
              ctx.strokeStyle = `rgba(255, 150, 80, ${falloff * st.opacity})`
              ctx.lineWidth = 2
              ctx.lineCap = 'round'
              ctx.beginPath()
              ctx.moveTo(px + OX, py + OX)
              ctx.lineTo(nx + OX, ny + OX)
              ctx.stroke()
              ctx.restore()

              // Inner bright pass — only for the brightest center of the arc
              if (falloff > 0.7) {
                ctx.save()
                ctx.shadowBlur = 6 * glowIntensity
                ctx.shadowColor = `rgba(255, 200, 150, ${falloff * st.opacity})`
                ctx.strokeStyle = `rgba(255, 220, 180, ${falloff * st.opacity})`
                ctx.lineWidth = 1
                ctx.lineCap = 'round'
                ctx.beginPath()
                ctx.moveTo(px + OX, py + OX)
                ctx.lineTo(nx + OX, ny + OX)
                ctx.stroke()
                ctx.restore()
              }
            }
          }
        }
      }

      // ── Schedule next frame or stop ────────────────────────────────────────
      if (st.active || st.opacity > 0) {
        st.raf = requestAnimationFrame(tickRef.current)
      } else {
        st.raf = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // All data accessed via refs — no reactive dependencies needed

  // ── Public handlers ────────────────────────────────────────────────────────

  const onFocus = useCallback(() => {
    const st = stateRef.current
    st.active = true
    st.speed = optsRef.current.burstSpeed
    st.targetSpeed = optsRef.current.settleSpeed
    if (st.raf === null) {
      st.raf = requestAnimationFrame(tickRef.current)
    }
  }, [])

  const onBlur = useCallback(() => {
    const st = stateRef.current
    st.active = false
    st.targetSpeed = 0
    // Loop continues naturally until opacity fades to 0
  }, [])

  // Cancel any pending RAF on unmount
  useEffect(() => {
    return () => {
      const { raf } = stateRef.current
      if (raf !== null) cancelAnimationFrame(raf)
      stateRef.current.raf = null
    }
  }, [])

  return { onFocus, onBlur }
}
