'use client'

import { useEffect, useState } from 'react'

const QUERY = '(max-width: 1023px)'

/** True below the lg breakpoint (1024px) — mobile/tablet layouts. */
export function useIsBelowLg(): boolean {
  const [isBelow, setIsBelow] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(QUERY).matches : false,
  )

  useEffect(() => {
    const mq = window.matchMedia(QUERY)
    const update = () => setIsBelow(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  return isBelow
}
