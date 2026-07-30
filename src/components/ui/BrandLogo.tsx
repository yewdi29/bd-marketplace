'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import Image from 'next/image'

/** Diamond silhouette from bd_logo-black.svg — outline only; facets are drawn dynamically. */
const DIAMOND_SILHOUETTE =
  'M120.296 9.46431L115.617 1.16648C115.249 0.466591 114.531 0.0374427 113.749 0.0316823L93.2805 0C92.5007 0 91.7769 0.432029 91.409 1.12903L87.0688 9.15037C86.6392 9.95682 86.7657 10.9534 87.3895 11.6273L101.911 27.7679C102.747 28.6608 104.159 28.6665 104.998 27.7737L119.966 11.9413C120.59 11.2731 120.723 10.2765 120.296 9.46431Z'

const FACET_COUNT = 8
const SPIN_DURATION_MS = 950
const SPIN_DEGREES = 180
const REST_ROTATION = 180 / FACET_COUNT // 22.5°

function ease(t: number): number {
  // Quick lift, long graceful settle (same as design specimen)
  return t < 0.5 ? 16 * Math.pow(t, 5) : 1 - Math.pow(-2 * t + 2, 5) / 2
}

/** Build facet path for a given girdle rotation (degrees). */
function facetsPath(rot: number): string {
  const cx = 103.6
  const R = 16.6
  const rT = 10.2
  const gy0 = 10.43
  const e = 1.15
  const kx = 103.45
  const ky = 28.44
  const N = FACET_COUNT
  const pts: [number, number][] = []
  let d = ''

  for (let k = 0; k < N; k++) {
    const a = ((rot + (k * 360) / N) * Math.PI) / 180
    const c = Math.cos(a)
    if (c <= 0) continue
    const s = Math.sin(a)
    const xg = cx + R * s
    const yg = gy0 + e * c
    const xt = cx + rT * s
    d += `M${xt.toFixed(2)} 0L${xg.toFixed(2)} ${yg.toFixed(2)}L${kx} ${ky}`
    pts.push([xg, yg])
  }

  pts.sort((p, q) => p[0] - q[0])
  d += `M${(cx - R - 4).toFixed(2)} ${gy0}`
  for (const p of pts) {
    d += `L${p[0].toFixed(2)} ${p[1].toFixed(2)}`
  }
  d += `L${(cx + R + 4).toFixed(2)} ${gy0}`
  return d
}

interface BrandLogoProps {
  /** Matches existing navbar/auth logo height. */
  height?: number
  priority?: boolean
  className?: string
}

/**
 * Full Black Diamond wordmark with hover-to-spin diamond facets.
 * Preserves the existing 244×29 lockup aspect ratio and display height.
 */
export default function BrandLogo({
  height = 27,
  priority = false,
  className = '',
}: BrandLogoProps) {
  // useId can include colons; those break SVG url(#…) / href references in some browsers.
  const reactId = useId().replace(/:/g, '')
  const silId = `bd-sil-${reactId}`
  const clipId = `bd-clip-${reactId}`

  const [rot, setRot] = useState(REST_ROTATION)
  const rotRef = useRef(REST_ROTATION)
  const tweenRef = useRef<{ from: number; to: number; t0: number; dur: number } | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const tick = useCallback(() => {
    if (rafRef.current != null) return

    const step = (now: number) => {
      rafRef.current = null
      const t = tweenRef.current
      if (!t) return

      const p = Math.min(1, (now - t.t0) / t.dur)
      const next = t.from + (t.to - t.from) * ease(p)

      if (p < 1) {
        rotRef.current = next
        setRot(next)
        rafRef.current = requestAnimationFrame(step)
        return
      }

      // Snap to rest phase within one facet cycle
      const per = 360 / FACET_COUNT
      const settled = REST_ROTATION + ((((t.to - REST_ROTATION) % per) + per) % per)
      tweenRef.current = null
      rotRef.current = settled
      setRot(settled)
    }

    rafRef.current = requestAnimationFrame(step)
  }, [])

  const spin = useCallback(() => {
    // One uninterruptible turn — re-entering mid-spin is ignored so cursor
    // flicking can't restart from a half-turn or land off-pattern.
    if (tweenRef.current) return

    const per = 360 / FACET_COUNT
    // Snap spin distance to a whole number of facet cycles (min one period).
    const deg = Math.max(per, Math.round(SPIN_DEGREES / per) * per)
    // Always start from a settled, aligned angle (rot only updates mid-spin
    // while tweenRef is set, so this is always at rest when we get here).
    const from = rotRef.current

    tweenRef.current = {
      from,
      to: from + deg,
      t0: performance.now(),
      dur: SPIN_DURATION_MS,
    }
    tick()
  }, [tick])

  const width = (height * 244) / 29

  return (
    <span
      className={`relative block shrink-0 ${className}`.trim()}
      style={{ height, width, aspectRatio: '244 / 29' }}
      onMouseEnter={spin}
    >
      <Image
        src="/bd_logo-wordmark.svg"
        alt="Black Diamond"
        width={244}
        height={29}
        priority={priority}
        className="block h-full w-full"
        style={{ height: '100%', width: '100%' }}
      />
      <svg
        viewBox="86.6 -0.15 34.5 28.75"
        aria-hidden
        className="pointer-events-none absolute overflow-visible"
        style={{
          left: '35.49%',
          top: '-0.52%',
          width: '14.14%',
          height: '99.14%',
        }}
      >
        <defs>
          <path id={silId} fill="none" stroke="#000000" strokeWidth="4.8" d={DIAMOND_SILHOUETTE} />
          <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
            <use href={`#${silId}`} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`}>
          <use href={`#${silId}`} fill="none" stroke="#000000" strokeWidth="4.8" />
          <path d={facetsPath(rot)} fill="none" stroke="#000000" strokeWidth="2.4" />
        </g>
      </svg>
    </span>
  )
}
