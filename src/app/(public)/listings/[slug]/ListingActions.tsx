'use client'

import { useEffect, useRef, useState } from 'react'
import {
  ShareIcon,
  SharePopoverPanel,
  useListingShareOptions,
} from '@/components/listings/ListingSharePopover'

interface Props {
  listingId: string
  initialSaved: boolean
  isLoggedIn: boolean
  listingTitle: string
  listingPrice: string
  listingLocation: string | null
  listingUrl: string
  showShare?: boolean
}

// ─── Icons ──────────────────────────────────────────────────────────────────

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      className="w-4 h-4 shrink-0"
      fill={filled ? '#CC0000' : 'none'}
      viewBox="0 0 24 24"
      stroke={filled ? '#CC0000' : '#4A4D52'}
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ListingActions({
  listingId,
  initialSaved,
  isLoggedIn,
  listingTitle,
  listingPrice,
  listingLocation,
  listingUrl,
  showShare = true,
}: Props) {
  const [saved, setSaved] = useState(initialSaved)
  const [savingLoading, setSavingLoading] = useState(false)
  const [popping, setPopping] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const shareRef = useRef<HTMLDivElement>(null)

  const { shareOptions } = useListingShareOptions({
    listingUrl,
    listingTitle,
    listingPrice,
    listingLocation,
  })

  // Close share popover on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) {
        setShareOpen(false)
      }
    }
    if (shareOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [shareOpen])

  async function handleSave() {
    if (!isLoggedIn) {
      window.location.href = `/auth/login?redirectTo=${encodeURIComponent(window.location.pathname)}`
      return
    }

    setSavingLoading(true)
    try {
      const method = saved ? 'DELETE' : 'POST'
      const res = await fetch(`/api/saved/${listingId}`, { method })
      if (res.ok) {
        setSaved(s => !s)
        setPopping(true)
        setTimeout(() => setPopping(false), 350)
      }
    } finally {
      setSavingLoading(false)
    }
  }

  const pillStyle: React.CSSProperties = {
    borderRadius: '100px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: 600,
  }

  return (
    <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
      {/* Save — desktop (≥1024px): unchanged pill with label */}
      <button
        onClick={handleSave}
        disabled={savingLoading}
        aria-label={saved ? 'Remove from saved' : 'Save listing'}
        className="hidden lg:flex gallery-action-pill items-center gap-1.5 text-ink transition-opacity disabled:opacity-60"
        style={pillStyle}
      >
        <span className={popping ? 'heart-pop' : ''}>
          <HeartIcon filled={saved} />
        </span>
        {saved ? 'Saved' : 'Save'}
      </button>

      {/* Save — mobile/tablet (<1024px): icon-only, 44x44 tap target around a
          smaller visual circle */}
      <button
        onClick={handleSave}
        disabled={savingLoading}
        aria-label={saved ? 'Remove from saved' : 'Save listing'}
        className="flex lg:hidden items-center justify-center shrink-0 transition-opacity disabled:opacity-60"
        style={{ width: 44, height: 44 }}
      >
        <div className="gallery-action-pill w-9 h-9 rounded-full flex items-center justify-center text-ink">
          <span className={popping ? 'heart-pop' : ''}>
            <HeartIcon filled={saved} />
          </span>
        </div>
      </button>

      {/* Share pill + popover */}
      {showShare && (
      <div className="relative" ref={shareRef}>
        {/* Desktop (≥1024px): unchanged pill with label */}
        <button
          onClick={() => setShareOpen(o => !o)}
          aria-label="Share listing"
          className="hidden lg:flex gallery-action-pill items-center gap-1.5 text-ink transition-opacity"
          style={pillStyle}
        >
          <ShareIcon />
          Share
        </button>

        {/* Mobile/tablet (<1024px): icon-only, 44x44 tap target */}
        <button
          onClick={() => setShareOpen(o => !o)}
          aria-label="Share listing"
          className="flex lg:hidden items-center justify-center shrink-0 transition-opacity"
          style={{ width: 44, height: 44 }}
        >
          <div className="gallery-action-pill w-9 h-9 rounded-full flex items-center justify-center text-ink">
            <ShareIcon />
          </div>
        </button>

        {shareOpen && (
          <SharePopoverPanel
            shareOptions={shareOptions}
            onSelect={() => setShareOpen(false)}
            className="absolute right-0"
          />
        )}
      </div>
      )}
    </div>
  )
}
