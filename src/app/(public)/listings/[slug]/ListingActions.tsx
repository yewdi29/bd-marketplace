'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
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
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({})
  const shareRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const { shareOptions } = useListingShareOptions({
    listingUrl,
    listingTitle,
    listingPrice,
    listingLocation,
  })

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      if (
        shareRef.current?.contains(target)
        || panelRef.current?.contains(target)
      ) {
        return
      }
      setShareOpen(false)
    }
    if (shareOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [shareOpen])

  useEffect(() => {
    if (!shareOpen || !shareRef.current) return

    function updatePosition() {
      if (!shareRef.current) return
      const rect = shareRef.current.getBoundingClientRect()
      const panelWidth = 200
      const panelHeight = 280
      const gap = 8
      const margin = 8

      let top = rect.bottom + gap
      if (top + panelHeight > window.innerHeight - margin) {
        top = Math.max(margin, rect.top - panelHeight - gap)
      }

      let left = rect.right - panelWidth
      if (left < margin) left = margin
      if (left + panelWidth > window.innerWidth - margin) {
        left = Math.max(margin, window.innerWidth - panelWidth - margin)
      }

      setPanelStyle({
        position: 'fixed',
        top,
        left,
        zIndex: 200,
      })
    }

    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
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

  const sharePanel = shareOpen ? (
    <div ref={panelRef}>
      <SharePopoverPanel
        shareOptions={shareOptions}
        onSelect={() => setShareOpen(false)}
        style={panelStyle}
      />
    </div>
  ) : null

  return (
    <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
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

      {showShare && (
        <div className="relative" ref={shareRef}>
          <button
            onClick={() => setShareOpen(o => !o)}
            aria-label="Share listing"
            className="hidden lg:flex gallery-action-pill items-center gap-1.5 text-ink transition-opacity"
            style={pillStyle}
          >
            <ShareIcon />
            Share
          </button>

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

          {sharePanel && typeof document !== 'undefined'
            ? createPortal(sharePanel, document.body)
            : null}
        </div>
      )}
    </div>
  )
}
