'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback } from 'react'
import { Camera } from 'lucide-react'
import { useListingGalleryNav } from './ListingGalleryNavContext'

interface Props {
  category: string
  categoryLabel: string
  title: string
}

function BackIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  )
}

const mobilePillStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  padding: '8px 16px',
  borderRadius: '100px',
  minHeight: 44,
}

function canNavigateBack(): boolean {
  if (typeof window === 'undefined') return false

  const state = window.history.state as { idx?: number } | null
  if (typeof state?.idx === 'number') return state.idx > 0

  return window.history.length > 1
}

// Desktop (≥1024px): unchanged breadcrumb trail. Mobile/tablet (<1024px):
// glossy pill Back (left) and View All (right) when gallery has items.
export default function ListingBreadcrumb({ category, categoryLabel, title }: Props) {
  const router = useRouter()
  const galleryNav = useListingGalleryNav()
  const fallbackHref = `/search?category=${encodeURIComponent(category)}`

  const handleBack = useCallback(() => {
    if (galleryNav?.gridOpen) {
      galleryNav.closeGrid()
      return
    }

    if (canNavigateBack()) {
      router.back()
      return
    }

    router.push(fallbackHref)
  }, [galleryNav, router, fallbackHref])

  const mobileViewAll = galleryNav && galleryNav.itemCount > 0 ? (
    <button
      type="button"
      onClick={galleryNav.openGrid}
      aria-label={`View all ${galleryNav.itemCount} items`}
      className="gallery-action-pill flex items-center gap-1.5 text-ink transition-opacity shrink-0"
      style={mobilePillStyle}
    >
      <Camera className="w-3.5 h-3.5 shrink-0" strokeWidth={2} aria-hidden />
      <span className="font-sans">View all</span>
      <span className="font-sans text-ink-3">({galleryNav.itemCount})</span>
    </button>
  ) : null

  return (
    <div className="py-3 lg:py-4">
      <div className="relative z-20 flex lg:hidden items-center justify-between gap-2">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Back"
          className="gallery-action-pill flex items-center gap-1.5 text-ink font-sans transition-opacity shrink-0 cursor-pointer"
          style={{ ...mobilePillStyle, touchAction: 'manipulation' }}
        >
          <BackIcon />
          Back
        </button>
        {mobileViewAll}
      </div>

      <div className="hidden lg:flex items-center gap-2" style={{ fontSize: '12px' }}>
        <Link href="/listings" className="text-ink-3 hover:text-ink transition-colors font-sans">
          Browse
        </Link>
        <span className="text-ink-3">/</span>
        <Link
          href={`/search?category=${category}`}
          className="text-ink-3 hover:text-ink transition-colors font-sans"
        >
          {categoryLabel}
        </Link>
        <span className="text-ink-3">/</span>
        <span className="text-ink font-sans font-medium truncate max-w-[300px]">{title}</span>
      </div>
    </div>
  )
}
