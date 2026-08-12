'use client'

import { useEffect, useRef } from 'react'

/** Light orange on the mission gray card — soft, readable, not full brand orange. */
const CHAR_COLOR = '#FFC4A8'
const FONT_PX = 9
const CELL_W = 5.4
const CELL_H = 9
const CHARS = ' .·:;~-=+*#%@'

/**
 * Smooth multi-sine ASCII wave field for the About mission card background.
 */
export default function MissionAsciiWave({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let running = true
    let cols = 0
    let rows = 0
    let dpr = 1

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const { width, height } = parent.getBoundingClientRect()
      if (width < 1 || height < 1) return
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      cols = Math.ceil(width / CELL_W) + 1
      rows = Math.ceil(height / CELL_H) + 1
    }

    const ro = new ResizeObserver(resize)
    if (canvas.parentElement) ro.observe(canvas.parentElement)
    resize()

    const start = performance.now()

    const frame = (now: number) => {
      if (!running) return
      const t = (now - start) / 1000
      const w = canvas.width / dpr
      const h = canvas.height / dpr

      ctx.clearRect(0, 0, w, h)
      ctx.font = `${FONT_PX}px var(--mono), 'Andale Mono', ui-monospace, monospace`
      ctx.textBaseline = 'top'
      ctx.fillStyle = CHAR_COLOR

      const mid = rows * 0.5

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c / cols
          // Layered smooth sines — slow, wide formations
          const wave =
            Math.sin(x * Math.PI * 2.2 + t * 0.55) * 0.42 +
            Math.sin(x * Math.PI * 4.1 - t * 0.38) * 0.22 +
            Math.sin(x * Math.PI * 1.1 + t * 0.22 + r * 0.04) * 0.12

          const crest = mid + wave * rows * 0.28
          const dist = Math.abs(r - crest)
          // Soft falloff around each crest + faint field elsewhere
          const near = Math.max(0, 1 - dist / 3.2)
          const ambient = 0.08
          const intensity = Math.min(1, ambient + near * near * 0.95)

          if (intensity < 0.12) continue

          const idx = Math.min(
            CHARS.length - 1,
            Math.floor(intensity * (CHARS.length - 1)),
          )
          const ch = CHARS[idx]
          if (ch === ' ') continue

          ctx.globalAlpha = 0.25 + intensity * 0.55
          ctx.fillText(ch, c * CELL_W, r * CELL_H)
        }
      }
      ctx.globalAlpha = 1

      raf = requestAnimationFrame(frame)
    }

    raf = requestAnimationFrame(frame)

    return () => {
      running = false
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        display: 'block',
      }}
    />
  )
}
