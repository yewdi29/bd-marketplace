'use client'
import createGlobe from 'cobe'
import { useEffect, useRef, useState } from 'react'

// ─── Constants ────────────────────────────────────────────────────────────────
const DPR = 2

// ─── Endpoint labels ──────────────────────────────────────────────────────────
// id matches the marker id in the COBE config.
// Divs are created imperatively inside COBE's wrapper after createGlobe() runs,
// then positioned each frame by reading COBE's hidden anchor div percentages.
const ENDPOINT_LABELS = [
  { id: 'guatemala', equipment: 'Pipe Casing',  price: '$62K'  },
  { id: 'edmonton',  equipment: 'Drilling Rig', price: '$1.8M' },
  { id: 'alexandria',equipment: 'Mud Pump',     price: '$95K'  },
  { id: 'istanbul',  equipment: 'Wellhead',     price: '$180K' },
  { id: 'dubai',     equipment: 'Top Drive',    price: '$380K' },
  { id: 'luanda',    equipment: 'Compressor',   price: '$420K' },
  { id: 'perth',     equipment: 'Haul Truck',   price: '$650K' },
  { id: 'prudhoe',   equipment: 'Arctic Rig',   price: '$4.2M' },
  { id: 'singapore', equipment: 'Crane',        price: '$890K' },
  { id: 'karachi',   equipment: 'Pump Unit',    price: '$120K' },
]

// ─── Component ────────────────────────────────────────────────────────────────
export default function Globe() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafGlobe  = useRef<number | null>(null)

  // Initial phi 0.5 centers the globe on the Atlantic (Americas left, Europe/ME right)
  const phiRef             = useRef(0.5)
  const thetaRef           = useRef(0.1)
  const velocityX          = useRef(0)
  const velocityY          = useRef(0)
  const pointerInteracting = useRef<{ x: number; y: number } | null>(null)
  const isHovering         = useRef(false)
  const spinSpeed          = useRef(0.0007)
  const lastX              = useRef(0)
  const lastY              = useRef(0)

  // ── Responsive size ──────────────────────────────────────────────────────────
  const [size, setSize] = useState(860)

  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth
      if (w < 768)  return window.innerWidth
      if (w < 1024) return Math.max(Math.round(window.innerHeight * 0.80),  680)
      if (w < 1280) return Math.max(Math.round(window.innerHeight * 0.95),  800)
      return Math.max(Math.round(window.innerHeight * 1.1), 900)
    }
    setSize(compute())
    const onResize = () => setSize(compute())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // ── Pointer handlers ─────────────────────────────────────────────────────────
  const onPointerDown = (e: React.PointerEvent) => {
    pointerInteracting.current = { x: e.clientX, y: e.clientY }
    lastX.current = e.clientX
    lastY.current = e.clientY
    velocityX.current = 0
    velocityY.current = 0
    if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing'
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointerInteracting.current) return
    const dX = e.clientX - lastX.current
    const dY = e.clientY - lastY.current
    phiRef.current   += dX * 0.004
    thetaRef.current += dY * 0.004
    thetaRef.current  = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, thetaRef.current))
    velocityX.current = dX * 0.004
    velocityY.current = dY * 0.004
    lastX.current = e.clientX
    lastY.current = e.clientY
  }

  const onPointerUp = () => {
    pointerInteracting.current = null
    if (canvasRef.current) canvasRef.current.style.cursor = 'grab'
  }

  // ── Main effect ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!canvasRef.current) return

    // ── COBE globe ────────────────────────────────────────────────────────────
    // arcs use from/to [lat,lng] tuples — startLat/startLng crashes cobe v2
    // arcAlt per arc is not in the cobe v2 type; global arcHeight controls altitude
    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: DPR,
      width:  size * DPR,
      height: size * DPR,
      phi:   phiRef.current,
      theta: thetaRef.current,
      dark: 0,
      diffuse: 3,
      mapSamples:    20000,
      mapBrightness: 3.5,
      baseColor:   [0.97, 0.97, 0.97] as [number, number, number],
      markerColor: [1, 0.42, 0.21]    as [number, number, number],
      glowColor:   [1, 1, 1]          as [number, number, number],
      markers: [
        { location: [ 31.84, -102.37] as [number, number], size: 0.02, id: 'odessa'     },
        { location: [ 29.76,  -95.36] as [number, number], size: 0.02, id: 'houston'    },
        { location: [ 53.54, -113.49] as [number, number], size: 0.02, id: 'edmonton'   },
        { location: [ 31.20,   29.92] as [number, number], size: 0.02, id: 'alexandria' },
        { location: [ 41.01,   28.97] as [number, number], size: 0.02, id: 'istanbul'   },
        { location: [ 25.20,   55.27] as [number, number], size: 0.02, id: 'dubai'      },
        { location: [ 57.14,   -2.10] as [number, number], size: 0.02, id: 'aberdeen'   },
        { location: [ 51.92,    4.47] as [number, number], size: 0.02, id: 'rotterdam'  },
        { location: [ -8.83,   13.24] as [number, number], size: 0.02, id: 'luanda'     },
        { location: [  1.35,  103.82] as [number, number], size: 0.02, id: 'singapore'  },
        { location: [-31.95,  115.86] as [number, number], size: 0.02, id: 'perth'      },
        { location: [ 24.86,   67.01] as [number, number], size: 0.02, id: 'karachi'    },
        { location: [ 51.04, -114.07] as [number, number], size: 0.02, id: 'calgary'    },
        { location: [ 70.25, -148.33] as [number, number], size: 0.02, id: 'prudhoe'    },
        { location: [ 15.78,  -90.23] as [number, number], size: 0.02, id: 'guatemala'  },
      ],
      arcs: [
        { from: [ 31.84, -102.37] as [number, number], to: [ 15.78,  -90.23] as [number, number], color: [1, 0.78, 0.58] as [number, number, number] },
        { from: [ 31.84, -102.37] as [number, number], to: [ 53.54, -113.49] as [number, number], color: [1, 0.78, 0.58] as [number, number, number] },
        { from: [ 29.76,  -95.36] as [number, number], to: [ 31.20,   29.92] as [number, number], color: [1, 0.78, 0.58] as [number, number, number] },
        { from: [ 29.76,  -95.36] as [number, number], to: [ 41.01,   28.97] as [number, number], color: [1, 0.78, 0.58] as [number, number, number] },
        { from: [ 29.76,  -95.36] as [number, number], to: [ 25.20,   55.27] as [number, number], color: [1, 0.78, 0.58] as [number, number, number] },
        { from: [ 51.92,    4.47] as [number, number], to: [ -8.83,   13.24] as [number, number], color: [1, 0.78, 0.58] as [number, number, number] },
        { from: [  1.35,  103.82] as [number, number], to: [-31.95,  115.86] as [number, number], color: [1, 0.78, 0.58] as [number, number, number] },
        { from: [ 51.04, -114.07] as [number, number], to: [ 70.25, -148.33] as [number, number], color: [1, 0.78, 0.58] as [number, number, number] },
        { from: [ 57.14,   -2.10] as [number, number], to: [ 25.20,   55.27] as [number, number], color: [1, 0.78, 0.58] as [number, number, number] },
        { from: [ 29.76,  -95.36] as [number, number], to: [  1.35,  103.82] as [number, number], color: [1, 0.78, 0.58] as [number, number, number] },
      ],
      arcColor: [1, 0.78, 0.58] as [number, number, number],
      arcWidth: 0.4,
    })

    // ── After createGlobe(), COBE has wrapped the canvas in its own div ───────
    // canvasRef.current.parentElement is now COBE's position:relative wrapper.
    const cobeWrapper = canvasRef.current.parentElement
    if (!cobeWrapper) {
      globe.destroy()
      return
    }

    // Create one label div per endpoint and append it inside COBE's wrapper.
    // This makes label divs siblings of COBE's anchor divs, sharing the same
    // percentage-based coordinate space.
    const labelEls: Record<string, HTMLDivElement> = {}
    ENDPOINT_LABELS.forEach(label => {
      const div = document.createElement('div')
      div.style.cssText = [
        'position:absolute',
        'background:white',
        'border:1px solid #E8E9EA',
        'border-radius:8px',
        'padding:4px 8px',
        'box-shadow:0 2px 8px rgba(0,0,0,0.08)',
        'white-space:nowrap',
        'pointer-events:none',
        'z-index:3',
        'transition:opacity 0.15s ease',
        'font-family:Inter,sans-serif',
        'opacity:0',
      ].join(';')
      div.innerHTML =
        `<div style="font-size:10px;font-weight:700;color:#1A1D20;margin-bottom:1px">${label.equipment}</div>` +
        `<div style="font-size:9px;font-family:'DM Mono',monospace;color:#FF6B35">${label.price}</div>`
      cobeWrapper.appendChild(div)
      labelEls[label.id] = div
    })

    // ── Globe spin + momentum ─────────────────────────────────────────────────
    function tick() {
      if (pointerInteracting.current === null) {
        const targetSpeed = isHovering.current ? 0 : 0.0007
        spinSpeed.current += (targetSpeed - spinSpeed.current) * 0.05
        phiRef.current += spinSpeed.current
        phiRef.current   += velocityX.current
        thetaRef.current += velocityY.current
        thetaRef.current  = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, thetaRef.current))
        velocityX.current *= 0.92
        velocityY.current *= 0.92
      }
      globe.update({ phi: phiRef.current, theta: thetaRef.current })
      rafGlobe.current = requestAnimationFrame(tick)
    }
    rafGlobe.current = requestAnimationFrame(tick)

    // ── Label positioning loop ────────────────────────────────────────────────
    // Each frame: find COBE's 1×1px anchor div for this marker (identified by
    // its style containing "--cobe-{id}"), read its left/top percentages,
    // convert to pixels, and position our label div offset from that point.
    // Visibility is read from the :root CSS custom property COBE sets to "N"
    // when the marker is on the front hemisphere, deleted when behind.
    let rafLabels: number
    function updateLabels() {
      ENDPOINT_LABELS.forEach(label => {
        const el = labelEls[label.id]
        if (!el) return

        // COBE's anchor div has "anchor-name:--cobe-{id}" in its style.
        // Match on the value portion to handle any whitespace normalisation.
        const anchor = cobeWrapper!.querySelector(
          `[style*="--cobe-${label.id}"]`
        ) as HTMLElement | null

        if (!anchor) return

        const leftPct = parseFloat(anchor.style.left)  // e.g. 45.2  (percent)
        const topPct  = parseFloat(anchor.style.top)   // e.g. 32.1  (percent)

        if (isNaN(leftPct) || isNaN(topPct)) return

        const wrapW = cobeWrapper!.offsetWidth
        const wrapH = cobeWrapper!.offsetHeight

        const x = (leftPct / 100) * wrapW
        const y = (topPct  / 100) * wrapH

        el.style.left = `${x + 14}px`
        el.style.top  = `${y - 28}px`

        // COBE sets --cobe-visible-{id} to "N" on :root when visible.
        // "N" is not a valid CSS value for opacity, so the browser treats it as
        // the initial value (1). When the property is absent the fallback 0 is used.
        const visVal = getComputedStyle(document.documentElement)
          .getPropertyValue(`--cobe-visible-${label.id}`)
          .trim()
        el.style.opacity = visVal === 'N' ? '1' : '0'
      })
      rafLabels = requestAnimationFrame(updateLabels)
    }
    updateLabels()

    // ── Cleanup ───────────────────────────────────────────────────────────────
    return () => {
      if (rafGlobe.current !== null) cancelAnimationFrame(rafGlobe.current)
      cancelAnimationFrame(rafLabels)
      globe.destroy()
      Object.values(labelEls).forEach(el => el.remove())
    }
  }, [size])

  // JSX: just the canvas — no label divs here.
  // Labels are appended imperatively into COBE's wrapper in the effect above.
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <canvas
        ref={canvasRef}
        width={size * DPR}
        height={size * DPR}
        style={{ width: size, height: size, cursor: 'grab', display: 'block' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onMouseEnter={() => { isHovering.current = true }}
        onMouseLeave={() => { isHovering.current = false }}
        onTouchStart={(e) => {
          const t = e.touches[0]
          pointerInteracting.current = { x: t.clientX, y: t.clientY }
          lastX.current = t.clientX
          lastY.current = t.clientY
          velocityX.current = 0
          velocityY.current = 0
        }}
        onTouchMove={(e) => {
          if (!pointerInteracting.current) return
          const t = e.touches[0]
          const dX = t.clientX - lastX.current
          const dY = t.clientY - lastY.current
          phiRef.current   += dX * 0.004
          thetaRef.current += dY * 0.004
          thetaRef.current  = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, thetaRef.current))
          velocityX.current = dX * 0.004
          velocityY.current = dY * 0.004
          lastX.current = t.clientX
          lastY.current = t.clientY
        }}
        onTouchEnd={onPointerUp}
      />
    </div>
  )
}
