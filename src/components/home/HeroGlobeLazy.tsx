'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { GlobePlaceholderStatic } from '@/components/home/GlobePlaceholderStatic'
import { scheduleAfterInteractive } from '@/lib/scheduleAfterInteractive'

const DESKTOP_GLOBE_MIN_WIDTH = 1000

const HeroGlobe = dynamic(() => import('@/components/home/HeroGlobe'), {
  ssr: false,
  loading: () => <GlobePlaceholderStatic />,
})

/** Desktop-only WebGL globe — deferred until hero is near viewport and the page is interactive. */
export default function HeroGlobeLazy() {
  const [shouldMount, setShouldMount] = useState(false)

  useEffect(() => {
    if (window.innerWidth < DESKTOP_GLOBE_MIN_WIDTH) return

    const hero = document.querySelector('[data-hero-section]')
    if (!hero) return

    let cancelled = false
    let cancelSchedule: (() => void) | undefined

    const scheduleMount = () => {
      if (cancelled || cancelSchedule) return
      cancelSchedule = scheduleAfterInteractive(() => {
        if (!cancelled) setShouldMount(true)
      })
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          scheduleMount()
          observer.disconnect()
        }
      },
      { rootMargin: '200px' },
    )
    observer.observe(hero)

    return () => {
      cancelled = true
      observer.disconnect()
      cancelSchedule?.()
    }
  }, [])

  if (!shouldMount) return null

  return <HeroGlobe />
}
