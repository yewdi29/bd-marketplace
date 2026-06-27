'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { scheduleAfterInteractive } from '@/lib/scheduleAfterInteractive'

const NewsletterForm = dynamic(() => import('@/components/NewsletterForm'), {
  ssr: false,
  loading: () => (
    <div className="flex gap-2" aria-hidden>
      <div className="flex-1 h-10 bg-[#F0F0F0] rounded-pill animate-pulse" />
      <div className="w-24 h-10 bg-[#F0F0F0] rounded-pill animate-pulse" />
    </div>
  ),
})

export default function NewsletterFormLazy({ source }: { source?: string }) {
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
    return (
      <div className="flex gap-2" aria-hidden>
        <div className="flex-1 h-10 bg-[#F0F0F0] rounded-pill animate-pulse" />
        <div className="w-24 h-10 bg-[#F0F0F0] rounded-pill animate-pulse" />
      </div>
    )
  }

  return <NewsletterForm source={source} />
}
