'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { GlobePlaceholderStatic } from '@/components/home/GlobePlaceholderStatic'

const DESKTOP_GLOBE_MIN_WIDTH = 1000

const HeroGlobe = dynamic(() => import('@/components/home/HeroGlobe'), {
  ssr: false,
  loading: () => <GlobePlaceholderStatic />,
})

export default function HeroGlobeLazy() {
  const [shouldMount, setShouldMount] = useState(false)

  useEffect(() => {
    if (window.innerWidth >= DESKTOP_GLOBE_MIN_WIDTH) {
      setShouldMount(true)
    }
  }, [])

  if (!shouldMount) return null

  return <HeroGlobe />
}
