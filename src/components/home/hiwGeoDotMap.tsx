'use client'

import { useEffect, useRef } from 'react'
import { MAP_MASK } from './hiwMapData'

interface Props {
  rippleProgress: number // 0 = all gray, 1 = all orange, values in between drive the ripple
  isActive: boolean
}

const GRAY = '#D1D5DB'
const ORANGE = '#FF6B35'

export default function HiwGeoDotMap({ rippleProgress, isActive }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return

    const drawMap = () => {
      const dpr = window.devicePixelRatio || 1
      const W = cv.offsetWidth
      const H = cv.offsetHeight
      if (W <= 0 || H <= 0) return

      cv.width = W * dpr
      cv.height = H * dpr
      const ctx = cv.getContext('2d')
      if (!ctx) return
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, W, H)

      const rows = MAP_MASK.length
      const cols = MAP_MASK[0].length
      const marginX = 8
      const spacing = (W - marginX * 2) / (cols - 1)
      const gridH = spacing * (rows - 1)
      const offY = (H - gridH) / 2
      const radius = Math.max(0.5, spacing * 0.38)

      const centerCol = cols / 2
      const centerRow = rows / 2
      const maxDist = Math.sqrt(centerCol * centerCol + centerRow * centerRow)

      for (let r = 0; r < rows; r++) {
        const line = MAP_MASK[r]
        const cy = offY + r * spacing
        for (let c = 0; c < cols; c++) {
          if (line[c] === '1') {
            const cx = marginX + c * spacing
            const dist = Math.sqrt((c - centerCol) ** 2 + (r - centerRow) ** 2)
            const normalizedDist = dist / maxDist
            const isOrange = isActive && rippleProgress > normalizedDist
            ctx.fillStyle = isOrange ? ORANGE : GRAY
            ctx.beginPath()
            ctx.arc(cx, cy, radius, 0, Math.PI * 2)
            ctx.fill()
          }
        }
      }
    }

    drawMap()

    const observer = new ResizeObserver(() => {
      drawMap()
    })
    observer.observe(cv)

    return () => observer.disconnect()
  }, [rippleProgress, isActive])

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  )
}
