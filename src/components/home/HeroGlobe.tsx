'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { GlobePlaceholder } from '@/components/home/GlobePlaceholder'

const Globe = dynamic(() => import('@/components/ui/Globe'), {
  ssr: false,
  loading: () => <GlobePlaceholder />,
})

/** Mounts WebGL immediately; pauses animation when hero leaves viewport. */
export default function HeroGlobe() {
  const [active, setActive] = useState(true)

  useEffect(() => {
    void import('@/components/ui/Globe')

    const el = document.querySelector('[data-hero-section]')
    if (!el) return

    const obs = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { threshold: 0 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return <Globe active={active} />
}
