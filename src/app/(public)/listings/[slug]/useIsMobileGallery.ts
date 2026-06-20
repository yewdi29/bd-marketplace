'use client'

import { useEffect, useState } from 'react'

const QUERY = '(max-width: 1023px)'

/** True below the lg breakpoint — mobile/tablet gallery behavior. */
export function useIsMobileGallery(): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia(QUERY)
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  return isMobile
}
