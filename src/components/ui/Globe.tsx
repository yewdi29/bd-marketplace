'use client'
import createGlobe from 'cobe'
import { useEffect, useRef, useState } from 'react'

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

type GlobeMode = 'mobile' | 'tablet' | 'desktop'

interface GlobeLayout {
  mode: GlobeMode
  size: number
  containerHeight: number
  left: number
  top: number
}

interface GlobeQuality {
  dpr: number
  mapSamples: number
}

function getGlobeQuality(mode: GlobeMode): GlobeQuality {
  if (mode === 'mobile') return { dpr: 1, mapSamples: 7000 }
  if (mode === 'tablet') return { dpr: 1.5, mapSamples: 9000 }
  return { dpr: 2, mapSamples: 12000 }
}

function computeLayout(w: number, h: number): GlobeLayout {
  if (w < 730) {
    return { mode: 'mobile', size: Math.max(Math.round(w * 1.35), 460), containerHeight: 440, left: 0, top: -60 }
  }
  if (w < 1000) {
    return { mode: 'tablet', size: Math.max(Math.round(w * 1.05), 760), containerHeight: 500, left: 0, top: -60 }
  }
  const size = Math.max(Math.round(h * 1.2), 960)
  const boundW = Math.min(w, 1280)
  const left = Math.round(Math.max(0, (w - 1280) / 2) + boundW * 0.75 - size / 2)
  return { mode: 'desktop', size, containerHeight: 0, left, top: -30 }
}

interface GlobeProps {
  embedded?: boolean
  embeddedSize?: number
  /** Pause animation when false (e.g. hero scrolled off-screen). */
  active?: boolean
}

export default function Globe({ embedded = false, embeddedSize = 220, active = true }: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafGlobe = useRef<number | null>(null)
  const rafLabels = useRef<number | null>(null)
  const animatingRef = useRef(false)
  const loopControlRef = useRef<{ start: () => void; stop: () => void } | null>(null)

  const phiRef             = useRef(0.5)
  const thetaRef           = useRef(0.1)
  const velocityX          = useRef(0)
  const velocityY          = useRef(0)
  const pointerInteracting = useRef<{ x: number; y: number } | null>(null)
  const isHovering         = useRef(false)
  const spinSpeed          = useRef(0.0007)
  const lastX              = useRef(0)
  const lastY              = useRef(0)

  const [layout, setLayout] = useState<GlobeLayout>(() =>
    typeof window !== 'undefined'
      ? computeLayout(window.innerWidth, window.innerHeight)
      : computeLayout(1280, 800),
  )
  const [reducedMotion, setReducedMotion] = useState(false)
  const [tabVisible, setTabVisible] = useState(true)

  const quality = embedded
    ? { dpr: 2, mapSamples: 8000 }
    : getGlobeQuality(layout.mode)

  const shouldAnimate = active && tabVisible && !reducedMotion
  const shouldAnimateRef = useRef(shouldAnimate)

  useEffect(() => {
    shouldAnimateRef.current = shouldAnimate
    if (shouldAnimate) loopControlRef.current?.start()
    else loopControlRef.current?.stop()
  }, [shouldAnimate])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const syncMotion = () => setReducedMotion(mq.matches)
    syncMotion()
    mq.addEventListener('change', syncMotion)

    const onVisibility = () => setTabVisible(!document.hidden)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      mq.removeEventListener('change', syncMotion)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  useEffect(() => {
    if (embedded) {
      setLayout({
        mode: 'desktop',
        size: embeddedSize,
        containerHeight: embeddedSize,
        left: 0,
        top: 0,
      })
      return
    }
    const update = () => setLayout(computeLayout(window.innerWidth, window.innerHeight))
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [embedded, embeddedSize])

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

  const { size } = layout
  const { dpr, mapSamples } = quality

  useEffect(() => {
    if (!canvasRef.current) return

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: dpr,
      width:  size * dpr,
      height: size * dpr,
      phi:   phiRef.current,
      theta: thetaRef.current,
      dark: 0,
      diffuse: 1,
      mapSamples,
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
      arcHeight: 0.15,
      markerElevation: 0,
    })

    const cobeWrapper = canvasRef.current.parentElement
    if (!cobeWrapper) { globe.destroy(); return }

    const labelEls: Record<string, HTMLDivElement> = {}
    const anchorEls: Record<string, HTMLElement | null> = {}
    ENDPOINT_LABELS.forEach(label => { anchorEls[label.id] = null })

    if (!embedded) {
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
    }

    function refreshAnchors() {
      ENDPOINT_LABELS.forEach(label => {
        if (anchorEls[label.id]?.isConnected) return
        anchorEls[label.id] = cobeWrapper!.querySelector(
          `[style*="--cobe-${label.id}"]`,
        ) as HTMLElement | null
      })
    }

    function stopGlobeLoop() {
      if (rafGlobe.current !== null) {
        cancelAnimationFrame(rafGlobe.current)
        rafGlobe.current = null
      }
      animatingRef.current = false
    }

    function stopLabelLoop() {
      if (rafLabels.current !== null) {
        cancelAnimationFrame(rafLabels.current)
        rafLabels.current = null
      }
    }

    function tick() {
      if (!shouldAnimateRef.current || document.hidden) {
        stopGlobeLoop()
        return
      }
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

    function updateLabels() {
      if (!shouldAnimateRef.current || document.hidden) {
        stopLabelLoop()
        return
      }
      const wrapW = cobeWrapper!.offsetWidth
      const wrapH = cobeWrapper!.offsetHeight
      if (wrapW > 0 && wrapH > 0) {
        refreshAnchors()
        const rootStyle = getComputedStyle(document.documentElement)
        ENDPOINT_LABELS.forEach(label => {
          const el = labelEls[label.id]
          const anchor = anchorEls[label.id]
          if (!el || !anchor) return
          const leftPct = parseFloat(anchor.style.left)
          const topPct  = parseFloat(anchor.style.top)
          if (isNaN(leftPct) || isNaN(topPct)) return
          el.style.left = `${(leftPct / 100) * wrapW + 14}px`
          el.style.top  = `${(topPct / 100) * wrapH - 28}px`
          const visVal = rootStyle.getPropertyValue(`--cobe-visible-${label.id}`).trim()
          el.style.opacity = visVal === 'N' ? '1' : '0'
        })
      }
      rafLabels.current = requestAnimationFrame(updateLabels)
    }

    function startLoops() {
      if (animatingRef.current) return
      animatingRef.current = true
      rafGlobe.current = requestAnimationFrame(tick)
      if (!embedded) updateLabels()
    }

    function stopLoops() {
      stopGlobeLoop()
      stopLabelLoop()
    }

    loopControlRef.current = { start: startLoops, stop: stopLoops }

    if (shouldAnimateRef.current && !document.hidden) {
      startLoops()
    }

    return () => {
      loopControlRef.current = null
      stopLoops()
      globe.destroy()
      Object.values(labelEls).forEach(el => el.remove())
    }
  }, [size, embedded, dpr, mapSamples])

  const isFlow = !embedded && (layout.mode === 'mobile' || layout.mode === 'tablet')

  const outerStyle: React.CSSProperties = embedded
    ? {
        position: 'relative',
        width: embeddedSize,
        height: embeddedSize,
        margin: '0 auto',
        zIndex: 1,
        pointerEvents: 'auto',
      }
    : isFlow
    ? {
        position: 'relative',
        marginTop: `${layout.top}px`,
        width: '100%',
        height: `${layout.containerHeight}px`,
        overflow: 'hidden',
        zIndex: 1,
        pointerEvents: 'auto',
      }
    : {
        position: 'absolute',
        left: `${layout.left}px`,
        top:  `${layout.top}px`,
        width: size,
        height: size,
        zIndex: 1,
        pointerEvents: 'auto',
      }

  return (
    <div style={outerStyle}>
      <div
        style={{
          position: isFlow ? 'absolute' : 'relative',
          ...(isFlow ? { left: '50%', top: 0, transform: 'translateX(-50%)' } : {}),
          width: size,
          height: size,
        }}
      >
        <canvas
          ref={canvasRef}
          width={Math.round(size * dpr)}
          height={Math.round(size * dpr)}
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
    </div>
  )
}
