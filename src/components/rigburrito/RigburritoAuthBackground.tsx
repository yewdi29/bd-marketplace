'use client'

import { useCallback, useEffect, useRef } from 'react'

type Rect = {
  x: number
  y: number
  w: number
  h: number
  speed: number
}

const BASE_COLOR = { r: 30, g: 30, b: 30 }
const GLOW_COLOR = { r: 255, g: 106, b: 43 }
const GLOW_RADIUS = 320
const ROWS = 14

function makeRect(randomX: boolean, width: number, rowH: number): Rect {
  const row = Math.floor(Math.random() * ROWS)
  const h = 6 + Math.random() * 8
  const w = 18 + Math.random() * 46
  const y = row * rowH + Math.random() * (rowH - h)
  const speed = 0.04 + Math.random() * 0.14
  const x = randomX ? Math.random() * width : -w
  return { x, y, w, h, speed }
}

export default function RigburritoAuthBackground() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: -9999, y: -9999 })
  const rectsRef = useRef<Rect[]>([])
  const sizeRef = useRef({ width: 0, height: 0 })
  const rafRef = useRef<number | null>(null)

  const initRects = useCallback((width: number, height: number) => {
    const count = Math.floor((width * height) / 9000)
    const rowH = height / ROWS
    rectsRef.current = Array.from({ length: count }, () => makeRect(true, width, rowH))
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const parent = containerRef.current
    if (!canvas || !parent) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const width = parent.clientWidth
      const height = parent.clientHeight
      sizeRef.current = { width, height }
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      initRects(width, height)
    }

    const step = () => {
      const { width, height } = sizeRef.current
      const mouse = mouseRef.current
      const rowH = height / ROWS

      ctx.clearRect(0, 0, width, height)

      for (const rect of rectsRef.current) {
        rect.x += rect.speed
        if (rect.x > width + rect.w) {
          Object.assign(rect, makeRect(false, width, rowH))
          rect.x = -rect.w
        }

        const cx = rect.x + rect.w / 2
        const cy = rect.y + rect.h / 2
        const dx = cx - mouse.x
        const dy = cy - mouse.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const t = Math.max(0, 1 - dist / GLOW_RADIUS)

        const rr = Math.round(BASE_COLOR.r + (GLOW_COLOR.r - BASE_COLOR.r) * t)
        const gg = Math.round(BASE_COLOR.g + (GLOW_COLOR.g - BASE_COLOR.g) * t)
        const bb = Math.round(BASE_COLOR.b + (GLOW_COLOR.b - BASE_COLOR.b) * t)

        if (t > 0.02) {
          ctx.save()
          ctx.shadowColor = `rgba(255,106,43,${0.85 * t})`
          ctx.shadowBlur = 24 * t
          ctx.fillStyle = `rgb(${rr},${gg},${bb})`
          ctx.fillRect(rect.x, rect.y, rect.w, rect.h)
          ctx.restore()
        } else {
          ctx.fillStyle = `rgb(${rr},${gg},${bb})`
          ctx.fillRect(rect.x, rect.y, rect.w, rect.h)
        }
      }

      rafRef.current = requestAnimationFrame(step)
    }

    const updateMouse = (clientX: number, clientY: number) => {
      const bounds = parent.getBoundingClientRect()
      const inside =
        clientX >= bounds.left &&
        clientX <= bounds.right &&
        clientY >= bounds.top &&
        clientY <= bounds.bottom

      if (!inside) {
        mouseRef.current = { x: -9999, y: -9999 }
        return
      }

      mouseRef.current = {
        x: clientX - bounds.left,
        y: clientY - bounds.top,
      }
    }

    const handleMouseMove = (e: MouseEvent) => updateMouse(e.clientX, e.clientY)

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', handleMouseMove)
    rafRef.current = requestAnimationFrame(step)

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [initRects])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden"
      style={{ background: '#131313' }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block h-full w-full"
        aria-hidden
      />
    </div>
  )
}
