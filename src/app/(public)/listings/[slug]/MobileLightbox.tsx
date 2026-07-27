'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { createPortal } from 'react-dom'
import PhotoSwipe from 'photoswipe'
import 'photoswipe/style.css'
import ScrubableThumbnailStrip from './ScrubableThumbnailStrip'
import { publicGalleryHasVideo, type PublicGalleryItem } from '@/lib/listings/publicGallery'

const GalleryMuxPlayer = dynamic(
  () => import('@/components/listings/GalleryMuxPlayer'),
  { ssr: false },
)

interface Props {
  open: boolean
  items: PublicGalleryItem[]
  title: string
  initialIndex: number
  shareUrl?: string
  shareTitle?: string
  lightboxOrigin?: 'direct' | 'grid'
  onIndexChange: (idx: number) => void
  onClose: () => void
}

function ChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ShareIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 00-6 6v3" />
    </svg>
  )
}

function normalizeIndex(idx: number, length: number) {
  if (length <= 0) return 0
  return ((idx % length) + length) % length
}

function MixedMediaLightbox({
  items,
  title,
  initialIndex,
  shareUrl,
  shareTitle,
  lightboxOrigin = 'direct',
  onIndexChange,
  onClose,
}: Omit<Props, 'open'>) {
  const [activeIdx, setActiveIdx] = useState(initialIndex)
  const [uiVisible, setUiVisible] = useState(true)
  const touchStartX = useRef<number | null>(null)

  useEffect(() => {
    setActiveIdx(initialIndex)
  }, [initialIndex])

  const total = items.length
  const active = items[activeIdx]
  const activeIsPhoto = active?.kind === 'photo'

  const goToIndex = useCallback((idx: number) => {
    const wrapped = normalizeIndex(idx, total)
    setActiveIdx(wrapped)
    onIndexChange(wrapped)
  }, [total, onIndexChange])

  function handleTouchStart(e: React.TouchEvent) {
    if (!activeIsPhoto) return
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (!activeIsPhoto || touchStartX.current === null) return
    const deltaX = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(deltaX) > 40) {
      if (deltaX < 0) goToIndex(activeIdx + 1)
      else goToIndex(activeIdx - 1)
    }
    touchStartX.current = null
  }

  async function handleShare() {
    if (!shareUrl) return
    const payload = {
      title: shareTitle ?? title,
      text: shareTitle ?? title,
      url: shareUrl,
    }
    try {
      if (navigator.share) {
        await navigator.share(payload)
      } else {
        await navigator.clipboard.writeText(shareUrl)
      }
    } catch {
      // User cancelled or clipboard unavailable
    }
  }

  if (!active) return null

  return (
    <div
      className="fixed inset-0 z-[1100] flex flex-col"
      style={{ background: 'rgba(20,21,23,0.97)' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={() => setUiVisible(v => !v)}
    >
      <div
        className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-200"
        style={{ opacity: uiVisible ? 1 : 0 }}
        data-gallery-chrome
      >
        <div
          className="pointer-events-auto absolute inset-x-0 top-0 flex items-center justify-between px-4"
          style={{ paddingTop: 'max(12px, env(safe-area-inset-top))', paddingBottom: '12px' }}
          onClick={e => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label={lightboxOrigin === 'grid' ? 'Back to media grid' : 'Back to listing'}
            className="flex items-center gap-1.5 rounded-pill px-4 py-2 text-sm font-sans font-semibold text-white bg-white/10 border border-white/20"
          >
            <ChevronLeft />
            {lightboxOrigin === 'grid' ? 'Back' : 'Close'}
          </button>

          {shareUrl && (
            <button
              type="button"
              onClick={handleShare}
              aria-label="Share listing"
              className="flex items-center justify-center w-10 h-10 rounded-full text-white bg-white/10 border border-white/20"
            >
              <ShareIcon />
            </button>
          )}
        </div>

        {total > 1 && (
          <div
            className="pointer-events-auto absolute inset-x-0 bottom-0 px-4"
            style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
            onClick={e => e.stopPropagation()}
          >
            <p className="text-center font-mono text-white/70 mb-3" style={{ fontSize: '12px' }}>
              {activeIdx + 1} / {total}
            </p>
            <div className="mx-auto px-3 py-3 bg-white rounded-[14px]" style={{ maxWidth: '92vw' }}>
              <ScrubableThumbnailStrip
                items={items}
                activeIdx={activeIdx}
                onSelect={goToIndex}
                onScrub={goToIndex}
                size={56}
              />
            </div>
          </div>
        )}
      </div>

      <div
        key={`${active.kind}:${active.id}`}
        className="relative flex flex-1 items-center justify-center min-h-0 px-2"
        onClick={e => e.stopPropagation()}
      >
        {active.kind === 'photo' ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={active.url}
            alt={active.alt_text ?? title}
            className="max-h-full max-w-full object-contain select-none"
            style={{ maxHeight: uiVisible && total > 1 ? 'calc(100vh - 180px)' : '100vh' }}
          />
        ) : (
          <div
            className="h-full w-full"
            style={{ maxHeight: uiVisible && total > 1 ? 'calc(100vh - 180px)' : '100vh' }}
          >
            <GalleryMuxPlayer
              playbackId={active.mux_playback_id}
              title={title}
              objectFit="contain"
              className="h-full w-full"
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default function MobileLightbox({
  open,
  items,
  title,
  initialIndex,
  shareUrl,
  shareTitle,
  lightboxOrigin = 'direct',
  onIndexChange,
  onClose,
}: Props) {
  const [mounted, setMounted] = useState(false)
  const [uiVisible, setUiVisible] = useState(false)
  const [activeIdx, setActiveIdx] = useState(initialIndex)

  const pswpRef = useRef<PhotoSwipe | null>(null)
  const uiVisibleRef = useRef(false)
  const onIndexChangeRef = useRef(onIndexChange)
  const onCloseRef = useRef(onClose)

  const photoItems = items.filter((item): item is PublicGalleryItem & { kind: 'photo' } => item.kind === 'photo')
  const hasVideo = publicGalleryHasVideo(items)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { onIndexChangeRef.current = onIndexChange }, [onIndexChange])
  useEffect(() => { onCloseRef.current = onClose }, [onClose])
  useEffect(() => { uiVisibleRef.current = uiVisible }, [uiVisible])

  useEffect(() => {
    if (open) setActiveIdx(initialIndex)
  }, [open, initialIndex])

  const goToIndex = useCallback((idx: number) => {
    const wrapped = normalizeIndex(idx, items.length)
    if (pswpRef.current && pswpRef.current.currIndex !== wrapped) {
      pswpRef.current.goTo(wrapped)
    }
    setActiveIdx(wrapped)
    onIndexChangeRef.current(wrapped)
  }, [items.length])

  useEffect(() => {
    if (!open || !mounted || hasVideo || photoItems.length === 0) return

    setUiVisible(false)

    const dataSource = photoItems.map(img => ({
      src: img.url,
      width: 1600,
      height: 1200,
      alt: img.alt_text ?? title,
    }))

    const startIndex = normalizeIndex(initialIndex, photoItems.length)

    const pswp = new PhotoSwipe({
      dataSource,
      index: startIndex,
      loop: photoItems.length > 2,
      preload: [2, 4],
      bgOpacity: 1,
      showHideAnimationType: 'fade',
      showAnimationDuration: 280,
      hideAnimationDuration: 280,
      escKey: true,
      arrowKeys: false,
      closeOnVerticalDrag: true,
      pinchToClose: false,
      clickToCloseNonZoomable: false,
      imageClickAction: false,
      bgClickAction: false,
      tapAction: (_point, event) => {
        const target = event.target as Element | null
        if (target?.closest('[data-gallery-chrome]')) return
        setUiVisible(v => !v)
      },
      doubleTapAction: 'zoom',
      counter: false,
      arrowPrev: false,
      arrowNext: false,
      close: false,
      zoom: false,
      mainClass: 'pswp--bd-mobile',
      paddingFn: () => {
        const showChrome = uiVisibleRef.current
        return {
          top: showChrome ? 64 : 12,
          bottom: showChrome && photoItems.length > 1 ? 132 : 12,
          left: 0,
          right: 0,
        }
      },
    })

    pswp.on('change', () => {
      const idx = pswp.currIndex
      setActiveIdx(idx)
      onIndexChangeRef.current(idx)
    })

    pswp.on('close', () => {
      onCloseRef.current()
    })

    pswp.on('verticalDrag', () => {
      if (uiVisibleRef.current) setUiVisible(false)
    })

    pswp.init()
    pswpRef.current = pswp
    setActiveIdx(startIndex)

    return () => {
      pswp.destroy()
      pswpRef.current = null
    }
  }, [open, mounted, hasVideo, photoItems, title, initialIndex])

  useEffect(() => {
    if (!open || hasVideo) return
    pswpRef.current?.updateSize()
  }, [uiVisible, open, hasVideo])

  async function handleShare() {
    if (!shareUrl) return
    const payload = {
      title: shareTitle ?? title,
      text: shareTitle ?? title,
      url: shareUrl,
    }
    try {
      if (navigator.share) {
        await navigator.share(payload)
      } else {
        await navigator.clipboard.writeText(shareUrl)
      }
    } catch {
      // User cancelled or clipboard unavailable
    }
  }

  if (!mounted || !open) return null

  if (hasVideo) {
    return createPortal(
      <MixedMediaLightbox
        items={items}
        title={title}
        initialIndex={initialIndex}
        shareUrl={shareUrl}
        shareTitle={shareTitle}
        lightboxOrigin={lightboxOrigin}
        onIndexChange={onIndexChange}
        onClose={onClose}
      />,
      document.body,
    )
  }

  const total = photoItems.length

  const chrome = (
    <div
      className="fixed inset-0 z-[100001] pointer-events-none transition-opacity duration-200"
      style={{ opacity: uiVisible ? 1 : 0 }}
      aria-hidden={!uiVisible}
    >
      <div
        data-gallery-chrome
        className="pointer-events-auto absolute inset-x-0 top-0 flex items-center justify-between px-4"
        style={{ paddingTop: 'max(12px, env(safe-area-inset-top))', paddingBottom: '12px' }}
      >
        <button
          type="button"
          onClick={() => pswpRef.current?.close()}
          aria-label={lightboxOrigin === 'grid' ? 'Back to photo grid' : 'Back to listing'}
          className="flex items-center gap-1.5 rounded-pill px-4 py-2 text-sm font-sans font-semibold text-white bg-white/10 border border-white/20"
        >
          <ChevronLeft />
          {lightboxOrigin === 'grid' ? 'Back' : 'Close'}
        </button>

        {shareUrl && (
          <button
            type="button"
            onClick={handleShare}
            aria-label="Share listing"
            className="flex items-center justify-center w-10 h-10 rounded-full text-white bg-white/10 border border-white/20"
          >
            <ShareIcon />
          </button>
        )}
      </div>

      {total > 1 && (
        <div
          data-gallery-chrome
          className="pointer-events-auto absolute inset-x-0 bottom-0 px-4"
          style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
        >
          <p className="text-center font-mono text-white/70 mb-3" style={{ fontSize: '12px' }}>
            {activeIdx + 1} / {total}
          </p>
          <div className="mx-auto px-3 py-3 bg-white rounded-[14px]" style={{ maxWidth: '92vw' }}>
            <ScrubableThumbnailStrip
              items={photoItems}
              activeIdx={activeIdx}
              onSelect={goToIndex}
              onScrub={goToIndex}
              size={56}
            />
          </div>
        </div>
      )}
    </div>
  )

  return createPortal(chrome, document.body)
}
