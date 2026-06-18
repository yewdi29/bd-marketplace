'use client'

import { useRef, useState, useEffect } from 'react'
import ListingCard from '@/components/ListingCard'
import type { Listing } from '@/lib/types/database'

interface FeaturedCarouselProps {
  listings: Listing[]
  isLoggedIn: boolean
  savedIds: string[]
}

export default function FeaturedCarousel({ listings, isLoggedIn, savedIds }: FeaturedCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft]   = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScroll = () => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    checkScroll()
    el.addEventListener('scroll', checkScroll, { passive: true })
    const ro = new ResizeObserver(checkScroll)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', checkScroll)
      ro.disconnect()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listings])

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -296 : 296, behavior: 'smooth' })
  }

  if (!listings.length) return null

  return (
    <div className="relative">
      {/* Left arrow */}
      <button
        onClick={() => scroll('left')}
        aria-label="Scroll left"
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white border border-[#E8E9EA] rounded-full shadow-card-hover flex items-center justify-center hover:border-[#D4D5D7] transition-all duration-200"
        style={{
          transform: 'translate(-50%, -50%)',
          opacity: canScrollLeft ? 1 : 0,
          pointerEvents: canScrollLeft ? 'auto' : 'none',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 3L5 8l5 5" stroke="#1A1D20" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Scrollable strip */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto"
        style={{
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          paddingBottom: '4px',
        }}
      >
        {listings.map(listing => (
          <div
            key={listing.id}
            className="flex-none"
            style={{ width: '280px', scrollSnapAlign: 'start' }}
          >
            <ListingCard
              listing={listing}
              isLoggedIn={isLoggedIn}
              initialSaved={savedIds.includes(listing.id)}
            />
          </div>
        ))}
      </div>

      {/* Right arrow */}
      <button
        onClick={() => scroll('right')}
        aria-label="Scroll right"
        className="absolute right-0 top-1/2 z-10 w-9 h-9 bg-white border border-[#E8E9EA] rounded-full shadow-card-hover flex items-center justify-center hover:border-[#D4D5D7] transition-all duration-200"
        style={{
          transform: 'translate(50%, -50%)',
          opacity: canScrollRight ? 1 : 0,
          pointerEvents: canScrollRight ? 'auto' : 'none',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M6 3l5 5-5 5" stroke="#1A1D20" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  )
}
