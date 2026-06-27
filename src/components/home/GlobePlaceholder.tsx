'use client'

import { useEffect, useState } from 'react'

function computePlaceholderLayout(w: number, h: number) {
  if (w < 730) {
    return { isFlow: true, size: Math.max(Math.round(w * 1.35), 460), containerHeight: 440, top: -60, left: 0 }
  }
  if (w < 1000) {
    return { isFlow: true, size: Math.max(Math.round(w * 1.05), 760), containerHeight: 500, top: -60, left: 0 }
  }
  const size = Math.max(Math.round(h * 1.2), 960)
  const boundW = Math.min(w, 1280)
  const left = Math.round(Math.max(0, (w - 1280) / 2) + boundW * 0.75 - size / 2)
  return { isFlow: false, size, containerHeight: 0, top: -30, left }
}

const SSR_LAYOUT = computePlaceholderLayout(1280, 800)

/** Static stand-in while the COBE chunk loads or before the hero enters view. */
export function GlobePlaceholder() {
  const [layout, setLayout] = useState(SSR_LAYOUT)

  useEffect(() => {
    const update = () => setLayout(computePlaceholderLayout(window.innerWidth, window.innerHeight))
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const { isFlow, size, containerHeight, top, left } = layout

  const outerStyle: React.CSSProperties = isFlow
    ? {
        position: 'relative',
        marginTop: `${top}px`,
        width: '100%',
        height: `${containerHeight}px`,
        overflow: 'hidden',
        zIndex: 1,
        pointerEvents: 'none',
      }
    : {
        position: 'absolute',
        left: `${left}px`,
        top: `${top}px`,
        width: size,
        height: size,
        zIndex: 1,
        pointerEvents: 'none',
      }

  return (
    <div style={outerStyle} aria-hidden>
      <div
        style={{
          position: isFlow ? 'absolute' : 'relative',
          ...(isFlow ? { left: '50%', top: 0, transform: 'translateX(-50%)' } : {}),
          width: size,
          height: size,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.95) 0%, rgba(232,233,234,0.55) 45%, rgba(232,233,234,0.25) 70%, transparent 100%)',
        }}
      />
    </div>
  )
}
