'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Camera } from 'lucide-react'
import type { ListingImage } from '@/lib/types/database'

interface Props {
  images: ListingImage[]
  title: string
  actions?: React.ReactNode
}

type View = 'inline' | 'grid' | 'lightbox'

function ChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

// ─── Thumbnail strip — shared between the inline view and the lightbox ────────

function ThumbnailStrip({
  images,
  activeIdx,
  onSelect,
  size = 64,
}: {
  images: ListingImage[]
  activeIdx: number
  onSelect: (idx: number) => void
  size?: number
}) {
  return (
    <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}>
      {images.map((img, idx) => {
        const active = idx === activeIdx
        return (
          <button
            key={img.id}
            onClick={e => { e.stopPropagation(); onSelect(idx) }}
            aria-label={`View photo ${idx + 1}`}
            className="shrink-0 bg-white transition-colors"
            style={{
              width: size,
              height: size,
              borderRadius: '10px',
              padding: '4px',
              border: `2px solid ${active ? '#FF6B35' : '#E8E9EA'}`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.url}
              alt={img.alt_text ?? `Photo ${idx + 1}`}
              className="w-full h-full object-cover"
              style={{ borderRadius: '6px' }}
            />
          </button>
        )
      })}
    </div>
  )
}

export default function PhotoGallery({ images, title, actions }: Props) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [view, setView] = useState<View>('inline')
  const [mounted, setMounted] = useState(false)
  const touchStartX = useRef<number | null>(null)

  useEffect(() => { setMounted(true) }, [])

  const sorted = [...images].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1
    if (!a.is_primary && b.is_primary) return 1
    return a.sort_order - b.sort_order
  })

  const active = sorted[activeIdx]
  const total = sorted.length

  const goTo = useCallback((idx: number) => {
    setActiveIdx(((idx % total) + total) % total)
  }, [total])

  const next = useCallback(() => goTo(activeIdx + 1), [activeIdx, goTo])
  const prev = useCallback(() => goTo(activeIdx - 1), [activeIdx, goTo])

  // Lock page scroll while a full-screen overlay is open. Body-only overflow
  // is not enough on iOS — also lock html, fix body position, and block
  // touchmove on the document except inside scrollable overlay regions.
  useEffect(() => {
    if (view === 'inline') return

    const scrollY = window.scrollY
    const prevHtmlOverflow = document.documentElement.style.overflow
    const prevBodyOverflow = document.body.style.overflow
    const prevBodyPosition = document.body.style.position
    const prevBodyTop = document.body.style.top
    const prevBodyWidth = document.body.style.width

    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'

    function preventTouchMove(e: TouchEvent) {
      const target = e.target as Element | null
      if (target?.closest('[data-gallery-overlay-scroll]')) return
      e.preventDefault()
    }
    document.addEventListener('touchmove', preventTouchMove, { passive: false })

    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow
      document.body.style.overflow = prevBodyOverflow
      document.body.style.position = prevBodyPosition
      document.body.style.top = prevBodyTop
      document.body.style.width = prevBodyWidth
      window.scrollTo(0, scrollY)
      document.removeEventListener('touchmove', preventTouchMove)
    }
  }, [view])

  // Escape closes the current overlay — from the lightbox it skips the grid
  // and goes straight back to the inline view as a convenience. Arrow keys
  // navigate photos while the lightbox is open.
  useEffect(() => {
    if (view === 'inline') return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setView('inline')
      if (view === 'lightbox') {
        if (e.key === 'ArrowRight') next()
        if (e.key === 'ArrowLeft') prev()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [view, next, prev])

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const deltaX = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(deltaX) > 40) {
      if (deltaX < 0) next()
      else prev()
    }
    touchStartX.current = null
  }

  // ── No photos placeholder ───────────────────────────────────────────────────
  if (total === 0) {
    return (
      <div
        className="relative w-full bg-[#F0F0F0] rounded-[16px] overflow-hidden flex flex-col items-center justify-center gap-3"
        style={{ aspectRatio: '4/3' }}
      >
        <svg
          className="text-ink-3 opacity-25"
          style={{ width: '48px', height: '48px' }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <span className="font-mono text-[11px] uppercase tracking-wider text-ink-3 opacity-50">
          No photos
        </span>
        {actions}
      </div>
    )
  }

  // ── State 2: Full-screen masonry grid overlay ──────────────────────────────
  const gridOverlay = view === 'grid' && (
    <div
      className="fixed inset-0 z-[1000] bg-white overflow-y-auto overscroll-contain"
      data-gallery-overlay-scroll
    >
      <button
        onClick={() => setView('inline')}
        aria-label="Back to listing"
        className="fixed top-5 left-5 z-10 flex items-center gap-1.5 bg-white border border-[#E8E9EA] rounded-pill shadow-card-hover px-4 py-2 text-sm font-sans font-semibold text-ink hover:border-[#D4D5D7] transition-all duration-200"
      >
        <ChevronLeft />
        Back
      </button>

      <div className="max-w-[1600px] mx-auto px-6 sm:px-10 pt-20 pb-16">
        <p className="font-sans font-bold text-ink mb-6" style={{ fontSize: '18px' }}>
          {total} Photos
        </p>
        <div className="columns-1 sm:columns-2 lg:columns-3" style={{ columnGap: '12px' }}>
          {sorted.map((img, idx) => (
            <div
              key={img.id}
              role="button"
              tabIndex={0}
              onClick={() => { setActiveIdx(idx); setView('lightbox') }}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setActiveIdx(idx)
                  setView('lightbox')
                }
              }}
              aria-label={`Open photo ${idx + 1}`}
              className="block overflow-hidden rounded-[10px] bg-[#F0F0F0] cursor-pointer hover:opacity-90 transition-opacity"
              style={{ width: '100%', marginBottom: '12px', breakInside: 'avoid', WebkitColumnBreakInside: 'avoid' } as React.CSSProperties}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.alt_text ?? `Photo ${idx + 1}`}
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // ── State 3: Focused lightbox — dark background, single image ─────────────
  const lightboxOverlay = view === 'lightbox' && (
    <div
      className="fixed inset-0 z-[1100] flex flex-col"
      style={{ background: 'rgba(20,21,23,0.97)' }}
      onClick={() => setView('inline')}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Close — steps back to the grid, one level at a time */}
      <button
        onClick={e => { e.stopPropagation(); setView('grid') }}
        aria-label="Close"
        className="fixed top-5 left-5 z-10 flex items-center gap-1.5 rounded-pill px-4 py-2 text-sm font-sans font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-colors"
      >
        <CloseIcon />
        Close
      </button>

      {/* Image area — fills remaining space above the thumbnail strip */}
      <div className="relative flex-1 flex items-center justify-center w-full min-h-0">
        {total > 1 && (
          <>
            <button
              onClick={e => { e.stopPropagation(); prev() }}
              aria-label="Previous photo"
              className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full flex items-center justify-center text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-colors"
            >
              <ChevronLeft />
            </button>
            <button
              onClick={e => { e.stopPropagation(); next() }}
              aria-label="Next photo"
              className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full flex items-center justify-center text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-colors"
            >
              <ChevronRight />
            </button>
          </>
        )}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={active.url}
          alt={active.alt_text ?? title}
          onClick={e => e.stopPropagation()}
          style={{ maxWidth: '90vw', maxHeight: '100%', objectFit: 'contain' }}
          className="select-none"
        />
      </div>

      {total > 1 && (
        <p
          className="text-center font-mono text-white/70"
          style={{ fontSize: '12px', marginBottom: '12px' }}
          onClick={e => e.stopPropagation()}
        >
          {activeIdx + 1} / {total}
        </p>
      )}

      {/* Thumbnail strip — same treatment as the inline gallery's strip */}
      {total > 1 && (
        <div
          className="mx-auto mb-6 px-4 py-3 bg-white rounded-[14px]"
          style={{ maxWidth: '92vw' }}
          onClick={e => e.stopPropagation()}
          data-gallery-overlay-scroll
        >
          <ThumbnailStrip images={sorted} activeIdx={activeIdx} onSelect={setActiveIdx} size={56} />
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* ── State 1: Inline main image — edge to edge, no padding ── */}
      <div
        className="relative w-full overflow-hidden outline-none"
        style={{ aspectRatio: '4/3' }}
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === 'ArrowRight') next()
          if (e.key === 'ArrowLeft') prev()
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={active.url}
          alt={active.alt_text ?? title}
          key={active.id}
          className="absolute inset-0 w-full h-full object-cover cursor-pointer"
          onClick={() => setView('grid')}
        />

        {/* Arrow navigation — desktop */}
        {total > 1 && (
          <>
            <button
              onClick={e => { e.stopPropagation(); prev() }}
              aria-label="Previous photo"
              className="gallery-action-pill absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full shadow-card-hover flex items-center justify-center transition-all duration-200 text-ink"
            >
              <ChevronLeft />
            </button>
            <button
              onClick={e => { e.stopPropagation(); next() }}
              aria-label="Next photo"
              className="gallery-action-pill absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full shadow-card-hover flex items-center justify-center transition-all duration-200 text-ink"
            >
              <ChevronRight />
            </button>
          </>
        )}

        {/* Photo count — bottom-right, opens the full grid */}
        {total > 1 && (
          <button
            onClick={e => { e.stopPropagation(); setView('grid') }}
            aria-label="View all photos"
            className="gallery-action-pill absolute bottom-3 right-3 z-10 flex items-center gap-1.5 text-ink transition-opacity"
            style={{
              fontSize: '13px',
              fontWeight: 600,
              padding: '8px 16px',
              borderRadius: '100px',
            }}
          >
            <Camera className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
            <span className="font-mono">{activeIdx + 1} / {total}</span>
          </button>
        )}

        {/* Save / Share overlay — top-right */}
        {actions && (
          <div onClick={e => e.stopPropagation()}>
            {actions}
          </div>
        )}
      </div>

      {/* Thumbnail strip — desktop only; mobile/tablet use swipe + arrows */}
      {total > 1 && (
        <div className="hidden lg:block px-3 py-3 bg-white">
          <ThumbnailStrip images={sorted} activeIdx={activeIdx} onSelect={setActiveIdx} />
        </div>
      )}

      {/* Grid + lightbox overlays render at document.body via a portal so they
          always paint above the fixed navbar regardless of ancestor stacking
          contexts created by this page's layout. */}
      {mounted && gridOverlay && createPortal(gridOverlay, document.body)}
      {mounted && lightboxOverlay && createPortal(lightboxOverlay, document.body)}
    </>
  )
}
