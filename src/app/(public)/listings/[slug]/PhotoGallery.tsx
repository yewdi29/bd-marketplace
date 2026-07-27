'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { createPortal } from 'react-dom'
import MobileLightbox from './MobileLightbox'
import GalleryThumbnailStrip from './GalleryThumbnailStrip'
import { useIsMobileGallery } from './useIsMobileGallery'
import { useListingGalleryNav } from './ListingGalleryNavContext'
import { muxThumbnailUrl } from '@/lib/listings/listingVideoUploadClient'
import type { ComponentProps } from 'react'
import type { PublicGalleryItem } from '@/lib/listings/publicGallery'
import ListingActions from './ListingActions'

const GalleryMuxPlayer = dynamic(
  () => import('@/components/listings/GalleryMuxPlayer'),
  { ssr: false },
)

interface Props {
  items: PublicGalleryItem[]
  title: string
  listingActions?: ComponentProps<typeof ListingActions>
  shareUrl?: string
  shareTitle?: string
}

type View = 'inline' | 'grid' | 'lightbox'
type LightboxOrigin = 'direct' | 'grid'

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

function PlayBadge({ large = false }: { large?: boolean }) {
  const size = large ? 'h-14 w-14' : 'h-10 w-10'
  const icon = large ? 18 : 14
  return (
    <span className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden>
      <span className={`flex ${size} items-center justify-center rounded-full bg-black/50 text-white`}>
        <svg width={icon} height={icon} viewBox="0 0 10 10" fill="currentColor">
          <path d="M2 1.5v7l6-3.5-6-3.5z" />
        </svg>
      </span>
    </span>
  )
}

function GalleryMediaSlide({
  item,
  title,
  objectFit,
  className,
  style,
  onPhotoClick,
}: {
  item: PublicGalleryItem
  title: string
  objectFit: 'cover' | 'contain'
  className?: string
  style?: React.CSSProperties
  onPhotoClick?: () => void
}) {
  if (item.kind === 'video') {
    return (
      <div className={className} style={style}>
        <GalleryMuxPlayer
          playbackId={item.mux_playback_id}
          title={title}
          objectFit={objectFit}
          className="h-full w-full"
        />
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={item.url}
      alt={item.alt_text ?? title}
      className={className}
      style={style}
      onClick={onPhotoClick}
    />
  )
}

export default function PhotoGallery({ items, title, listingActions, shareUrl, shareTitle }: Props) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [view, setView] = useState<View>('inline')
  const [lightboxOrigin, setLightboxOrigin] = useState<LightboxOrigin | null>(null)
  const [mounted, setMounted] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const isMobile = useIsMobileGallery()
  const galleryNav = useListingGalleryNav()

  useEffect(() => { setMounted(true) }, [])

  const enterGrid = useCallback(() => {
    setView('grid')
    galleryNav?.openGrid()
  }, [galleryNav])

  const exitGrid = useCallback(() => {
    setView('inline')
    galleryNav?.closeGrid()
  }, [galleryNav])

  useEffect(() => {
    if (!galleryNav) return

    if (galleryNav.gridOpen) {
      if (view === 'inline') setView('grid')
    } else if (view === 'grid') {
      setView('inline')
    }
  }, [galleryNav, galleryNav?.gridOpen, view])

  const sorted = useMemo(() => [...items].sort((a, b) => a.gallery_position - b.gallery_position), [items])

  const active = sorted[activeIdx]
  const total = sorted.length
  const activeIsPhoto = active?.kind === 'photo'

  const goTo = useCallback((idx: number) => {
    setActiveIdx(((idx % total) + total) % total)
  }, [total])

  const next = useCallback(() => goTo(activeIdx + 1), [activeIdx, goTo])
  const prev = useCallback(() => goTo(activeIdx - 1), [activeIdx, goTo])

  const openLightbox = useCallback((origin: LightboxOrigin, idx?: number) => {
    if (idx !== undefined) setActiveIdx(idx)
    setLightboxOrigin(origin)
    setView('lightbox')
  }, [])

  const closeLightbox = useCallback(() => {
    setView(lightboxOrigin === 'grid' ? 'grid' : 'inline')
    setLightboxOrigin(null)
  }, [lightboxOrigin])

  // Safety net: restore document scroll lock if the gallery unmounts mid-overlay.
  useEffect(() => {
    return () => {
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
    }
  }, [])

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
      if (target?.closest('[data-gallery-thumb-strip]')) return
      if (target?.closest('.pswp')) return
      if (target?.closest('mux-player')) return
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

  useEffect(() => {
    if (view === 'inline') return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (view === 'lightbox') closeLightbox()
        else if (view === 'grid') exitGrid()
        else setView('inline')
        return
      }
      if (view === 'lightbox' && !isMobile) {
        if (e.key === 'ArrowRight') next()
        if (e.key === 'ArrowLeft') prev()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [view, next, prev, isMobile, closeLightbox, exitGrid])

  function handleTouchStart(e: React.TouchEvent) {
    if (!activeIsPhoto) return
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (!activeIsPhoto || touchStartX.current === null) return
    const deltaX = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(deltaX) > 40) {
      if (deltaX < 0) next()
      else prev()
    }
    touchStartX.current = null
  }

  const galleryActionsOverlay = listingActions ? (
    <div onClick={e => e.stopPropagation()}>
      <ListingActions {...listingActions} />
    </div>
  ) : null

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
        {galleryActionsOverlay}
      </div>
    )
  }

  const gridOverlay = view === 'grid' && (
    <div
      className="fixed inset-0 z-[1000] bg-white overflow-y-auto overscroll-contain"
      data-gallery-overlay-scroll
    >
      <div className="page-shell pb-16">
        <div className="sticky top-0 z-10 pt-5 pb-4 bg-white">
          <button
            onClick={exitGrid}
            aria-label="Back to listing"
            className="inline-flex items-center gap-1.5 bg-white border border-[#E8E9EA] rounded-pill shadow-card-hover px-4 py-2 text-sm font-sans font-semibold text-ink hover:border-[#D4D5D7] transition-all duration-200"
          >
            <ChevronLeft />
            Back
          </button>
        </div>

        <p className="font-sans font-bold text-ink mb-6" style={{ fontSize: '18px' }}>
          {total} {total === 1 ? 'Item' : 'Items'}
        </p>
        <div className="columns-1 sm:columns-2 lg:columns-3" style={{ columnGap: '12px' }}>
          {sorted.map((item, idx) => (
            <div
              key={`${item.kind}:${item.id}`}
              role="button"
              tabIndex={0}
              onClick={() => openLightbox('grid', idx)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  openLightbox('grid', idx)
                }
              }}
              aria-label={item.kind === 'photo' ? `Open photo ${idx + 1}` : `Open video ${idx + 1}`}
              className="relative block overflow-hidden rounded-[10px] bg-[#F0F0F0] cursor-pointer hover:opacity-90 transition-opacity"
              style={{ width: '100%', marginBottom: '12px', breakInside: 'avoid', WebkitColumnBreakInside: 'avoid' } as React.CSSProperties}
            >
              {item.kind === 'photo' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.url}
                  alt={item.alt_text ?? `Photo ${idx + 1}`}
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
              ) : (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={muxThumbnailUrl(item.mux_playback_id)}
                    alt={`Video ${idx + 1}`}
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                  />
                  <PlayBadge large />
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const mobileLightbox = view === 'lightbox' && isMobile && (
    <MobileLightbox
      open
      items={sorted}
      title={title}
      initialIndex={activeIdx}
      shareUrl={shareUrl}
      shareTitle={shareTitle}
      lightboxOrigin={lightboxOrigin ?? 'direct'}
      onIndexChange={setActiveIdx}
      onClose={closeLightbox}
    />
  )

  const desktopLightboxOverlay = view === 'lightbox' && !isMobile && active && (
    <div
      className="fixed inset-0 z-[1100] flex flex-col"
      style={{ background: 'rgba(20,21,23,0.97)' }}
      onClick={closeLightbox}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <button
        onClick={e => { e.stopPropagation(); closeLightbox() }}
        aria-label={lightboxOrigin === 'grid' ? 'Back to media grid' : 'Back to listing'}
        className="fixed top-5 left-5 z-10 flex items-center gap-1.5 rounded-pill px-4 py-2 text-sm font-sans font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-colors"
      >
        <CloseIcon />
        {lightboxOrigin === 'grid' ? 'Back' : 'Close'}
      </button>

      <div className="relative flex-1 flex items-center justify-center w-full min-h-0 px-4">
        {total > 1 && (
          <>
            <button
              onClick={e => { e.stopPropagation(); prev() }}
              aria-label="Previous item"
              className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full flex items-center justify-center text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-colors"
            >
              <ChevronLeft />
            </button>
            <button
              onClick={e => { e.stopPropagation(); next() }}
              aria-label="Next item"
              className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full flex items-center justify-center text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-colors"
            >
              <ChevronRight />
            </button>
          </>
        )}

        <div
          key={`${active.kind}:${active.id}`}
          className="flex h-full w-full max-w-[90vw] items-center justify-center"
          onClick={e => e.stopPropagation()}
        >
          <GalleryMediaSlide
            item={active}
            title={title}
            objectFit="contain"
            className={active.kind === 'photo' ? 'max-h-full max-w-full select-none object-contain' : 'h-full w-full max-h-[85vh]'}
            style={active.kind === 'photo' ? { maxWidth: '90vw', maxHeight: '100%', objectFit: 'contain' } : undefined}
          />
        </div>
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

      {total > 1 && (
        <div
          className="mx-auto mb-6 px-4 py-3 bg-white rounded-[14px]"
          style={{ maxWidth: '92vw' }}
          onClick={e => e.stopPropagation()}
          data-gallery-overlay-scroll
        >
          <GalleryThumbnailStrip items={sorted} activeIdx={activeIdx} onSelect={setActiveIdx} size={56} />
        </div>
      )}
    </div>
  )

  return (
    <>
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
        {active && (
          <div key={`${active.kind}:${active.id}`} className="absolute inset-0">
            {active.kind === 'photo' ? (
              <GalleryMediaSlide
                item={active}
                title={title}
                objectFit="cover"
                className="absolute inset-0 h-full w-full cursor-pointer object-cover"
                onPhotoClick={() => openLightbox('direct')}
              />
            ) : (
              <GalleryMediaSlide
                item={active}
                title={title}
                objectFit="cover"
                className="absolute inset-0 h-full w-full"
              />
            )}
          </div>
        )}

        {total > 1 && (
          <>
            <button
              onClick={e => { e.stopPropagation(); prev() }}
              aria-label="Previous item"
              className="gallery-action-pill absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full shadow-card-hover flex items-center justify-center transition-all duration-200 text-ink"
            >
              <ChevronLeft />
            </button>
            <button
              onClick={e => { e.stopPropagation(); next() }}
              aria-label="Next item"
              className="gallery-action-pill absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full shadow-card-hover flex items-center justify-center transition-all duration-200 text-ink"
            >
              <ChevronRight />
            </button>
          </>
        )}

        {galleryActionsOverlay}
      </div>

      {total > 1 && (
        <div className="hidden lg:block px-3 py-3 bg-white">
          <GalleryThumbnailStrip
            items={sorted}
            activeIdx={activeIdx}
            onSelect={setActiveIdx}
            onViewAll={enterGrid}
          />
        </div>
      )}

      {mounted && gridOverlay && createPortal(gridOverlay, document.body)}
      {mounted && mobileLightbox}
      {mounted && desktopLightboxOverlay && createPortal(desktopLightboxOverlay, document.body)}
    </>
  )
}
