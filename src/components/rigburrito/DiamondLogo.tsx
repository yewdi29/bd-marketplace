'use client'

import { useEffect, useRef } from 'react'

const REVOLUTION_MS = 10000

interface DiamondLogoProps {
  className?: string
  size?: number
}

export default function DiamondLogo({ className = '', size = 50 }: DiamondLogoProps) {
  const gemRef = useRef<SVGGElement>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const gem = gemRef.current
    if (!gem) return

    const NS = 'http://www.w3.org/2000/svg'
    const N = 6
    const lines: { crown: SVGLineElement; pav: SVGLineElement; phi: number }[] = []

    for (let i = 0; i < N; i++) {
      const crown = document.createElementNS(NS, 'line')
      const pav = document.createElementNS(NS, 'line')
      for (const line of [crown, pav]) {
        line.setAttribute('stroke', '#ffffff')
        line.setAttribute('stroke-width', '1.8')
        line.setAttribute('stroke-linecap', 'round')
        line.setAttribute('stroke-linejoin', 'round')
        gem.appendChild(line)
      }
      lines.push({ crown, pav, phi: i * ((2 * Math.PI) / N) })
    }

    const start = performance.now()

    const tick = (now: number) => {
      const cx = 24
      const yTop = 13
      const yGird = 21
      const yBot = 38
      const Rt = 9
      const Rg = 15
      const theta = -((now - start) / REVOLUTION_MS) * 2 * Math.PI

      for (const o of lines) {
        const a = o.phi + theta
        const cosA = Math.cos(a)
        const z = Math.sin(a)
        const gx = cx + Rg * cosA
        const tx = cx + Rt * cosA

        o.crown.setAttribute('x1', tx.toFixed(2))
        o.crown.setAttribute('y1', String(yTop))
        o.crown.setAttribute('x2', gx.toFixed(2))
        o.crown.setAttribute('y2', String(yGird))

        o.pav.setAttribute('x1', gx.toFixed(2))
        o.pav.setAttribute('y1', String(yGird))
        o.pav.setAttribute('x2', String(cx))
        o.pav.setAttribute('y2', String(yBot))

        const visible = z >= -0.02
        o.crown.setAttribute('opacity', visible ? '1' : '0')
        o.pav.setAttribute('opacity', visible ? '1' : '0')
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      for (const { crown, pav } of lines) {
        crown.remove()
        pav.remove()
      }
    }
  }, [])

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M17 13 L31 13 Q33 13 34.2 14.6 L37.8 19.4 Q39 21 37.68 22.5 L25.32 36.5 Q24 38 22.68 36.5 L10.32 22.5 Q9 21 10.2 19.4 L13.8 14.6 Q15 13 17 13 Z"
        stroke="#ffffff"
        strokeWidth="1.8"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <line
        x1="9"
        y1="21"
        x2="39"
        y2="21"
        stroke="#ffffff"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <g ref={gemRef} />
    </svg>
  )
}
