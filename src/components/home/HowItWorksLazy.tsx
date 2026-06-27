'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { scheduleAfterInteractive } from '@/lib/scheduleAfterInteractive'

const HowItWorksSection = dynamic(() => import('@/components/home/HowItWorksSection'), {
  ssr: false,
  loading: () => <div style={{ minHeight: '400px' }} aria-hidden />,
})

/** Defers D3, topojson, and canvas work until after the page is interactive. */
export default function HowItWorksLazy() {
  const [shouldMount, setShouldMount] = useState(false)

  useEffect(() => {
    let cancelled = false
    const cancelSchedule = scheduleAfterInteractive(() => {
      if (!cancelled) setShouldMount(true)
    })
    return () => {
      cancelled = true
      cancelSchedule()
    }
  }, [])

  if (!shouldMount) {
    return <div style={{ minHeight: '400px' }} aria-hidden />
  }

  return <HowItWorksSection />
}
