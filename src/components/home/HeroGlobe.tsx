'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { GlobePlaceholderStatic } from '@/components/home/GlobePlaceholderStatic'
import { scheduleAfterInteractive } from '@/lib/scheduleAfterInteractive'

const HeroGlobeThree = dynamic(() => import('@/components/home/HeroGlobeThree'), {
  ssr: false,
  loading: () => <GlobePlaceholderStatic />,
})

/** Defers Three.js WebGL until after the page is interactive; pauses when off-screen. */
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
  return <HeroGlobeThree active={active} />
}
