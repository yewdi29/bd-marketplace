'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'

const HowItWorksSection = dynamic(
  () => import('@/components/home/HowItWorksSection'),
  { ssr: false, loading: () => <div style={{ minHeight: '400px' }} aria-hidden /> }
)

export default function HowItWorksLazy() {
  const [shouldMount, setShouldMount] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldMount(true)
          observer.disconnect()
        }
      },
      { rootMargin: '400px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  if (!shouldMount) {
    return <div ref={ref} style={{ minHeight: '400px' }} aria-hidden />
  }
  return <HowItWorksSection />
}
