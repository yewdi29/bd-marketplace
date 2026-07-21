'use client'

import { type RefObject, useEffect, useState } from 'react'

/**
 * 0 when the section top is at the viewport bottom (entering),
 * 1 when the section bottom is at the viewport top (leaving).
 * Updates on scroll/resize via requestAnimationFrame (passive scroll listener).
 */
export function useSectionScrollProgress(
  ref: RefObject<HTMLElement | null>,
  enabled: boolean,
): number {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!enabled) return

    let raf = 0

    const measure = () => {
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const vh = window.innerHeight
      const range = rect.height + vh
      if (range <= 0) return
      const next = Math.max(0, Math.min(1, (vh - rect.top) / range))
      setProgress(prev => (Math.abs(prev - next) < 0.0005 ? prev : next))
    }

    const schedule = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(measure)
    }

    schedule()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule, { passive: true })

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [ref, enabled])

  return progress
}
