'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { GlobePlaceholderStatic } from '@/components/home/GlobePlaceholderStatic'
import { scheduleAfterInteractive } from '@/lib/scheduleAfterInteractive'

const Globe = dynamic(() => import('@/components/ui/Globe'), {
  ssr: false,
  loading: () => <div style={{ width: '100%', height: '100%' }} aria-hidden />,
})

/** Defers COBE WebGL until after the page is interactive; pauses when off-screen. */
export default function HeroGlobe() {
  const [shouldMount, setShouldMount] = useState(false)
  const [active, setActive] = useState(true)

  useEffect(() => {
    let cancelled = false
    const cancelSchedule = scheduleAfterInteractive(() => {
      if (!cancelled) setShouldMount(true)
    })

    const el = document.querySelector('[data-hero-section]')
    if (!el) {
      return cancelSchedule
    }

    const obs = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { threshold: 0 },
    )
    obs.observe(el)

    return () => {
      cancelled = true
      cancelSchedule()
      obs.disconnect()
    }
  }, [])

  if (!shouldMount) return <GlobePlaceholderStatic />
  return <Globe active={active} />
}
