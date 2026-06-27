'use client'

import { Suspense } from 'react'
import SearchBar from '@/components/marketplace/SearchBar'

const SEARCH_BAR_FALLBACK = (
  <div
    className="w-full"
    style={{ height: '40px', borderRadius: '100px', background: 'rgba(255,255,255,0.85)', border: '1.5px solid #E8E9EA' }}
  />
)

export default function NavbarDesktopSearch() {
  return (
    <div className="flex justify-center">
      <div className="w-full max-w-[440px]">
        <Suspense fallback={SEARCH_BAR_FALLBACK}>
          <SearchBar variant="nav" />
        </Suspense>
      </div>
    </div>
  )
}
