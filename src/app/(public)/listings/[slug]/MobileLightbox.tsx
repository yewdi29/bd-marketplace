'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import PhotoSwipe from 'photoswipe'
import 'photoswipe/style.css'
import type { ListingImage } from '@/lib/types/database'
import ScrubableThumbnailStrip from './ScrubableThumbnailStrip'

interface Props {
  open: boolean
  images: ListingImage[]
  title: string
  initialIndex: number
  shareUrl?: string
  shareTitle?: string
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

export default function MobileLightbox({
  open,
  images,
  title,
  initialIndex,
  shareUrl,
  shareTitle,
  onIndexChange,
  onClose,
}: Props) {
  const [mounted, setMounted] = useState(false)
  const [uiVisible, setUiVisible] = useState(false)
  const [activeIdx, setActiveIdx] = useState(initialIndex)

  const pswpRef = useRef<PhotoSwipe | null>(null)
  const uiVisibleRef = useRef(false)
  const syncingFromStripRef = useRef(false)
  const onIndexChangeRef = useRef(onIndexChange)
  const onCloseRef = useRef(onClose)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { onIndexChangeRef.current = onIndexChange }, [onIndexChange])
  useEffect(() => { onCloseRef.current = onClose }, [onClose])
  useEffect(() => { uiVisibleRef.current = uiVisible }, [uiVisible])

  useEffect(() => {
    if (open) setActiveIdx(initialIndex)
  }, [open, initialIndex])

  const goToIndex = useCallback((idx: number) => {
    const clamped = Math.max(0, Math.min(images.length - 1, idx))
    if (pswpRef.current && pswpRef.current.currIndex !== clamped) {
      syncingFromStripRef.current = true
      pswpRef.current.goTo(clamped)
    }
    setActiveIdx(clamped)
    onIndexChangeRef.current(clamped)
  }, [images.length])

  // PhotoSwipe instance — mount when open, destroy on close.
  useEffect(() => {
    if (!open || !mounted || images.length === 0) return

    setUiVisible(false)

    const dataSource = images.map(img => ({
      src: img.url,
      width: 1600,
      height: 1200,
      alt: img.alt_text ?? title,
    }))

    const startIndex = initialIndex

    const pswp = new PhotoSwipe({
      dataSource,
      index: startIndex,
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
          bottom: showChrome && images.length > 1 ? 132 : 12,
          left: 0,
          right: 0,
        }
      },
    })

    pswp.on('change', () => {
      syncingFromStripRef.current = false
      const idx = pswp.currIndex
      setActiveIdx(idx)
      if (!syncingFromStripRef.current) {
        onIndexChangeRef.current(idx)
      }
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
  }, [open, mounted, images, title])

  // Re-layout slides when chrome toggles (extra padding for strip / top bar).
  useEffect(() => {
    if (!open) return
    pswpRef.current?.updateSize()
  }, [uiVisible, open])

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

  const total = images.length

  const chrome = (
    <div
      className="fixed inset-0 z-[100001] pointer-events-none transition-opacity duration-200"
      style={{ opacity: uiVisible ? 1 : 0 }}
      aria-hidden={!uiVisible}
    >
      {/* Top bar — back + share */}
      <div
        data-gallery-chrome
        className="pointer-events-auto absolute inset-x-0 top-0 flex items-center justify-between px-4"
        style={{ paddingTop: 'max(12px, env(safe-area-inset-top))', paddingBottom: '12px' }}
      >
        <button
          type="button"
          onClick={() => pswpRef.current?.close()}
          aria-label="Back to photo grid"
          className="flex items-center gap-1.5 rounded-pill px-4 py-2 text-sm font-sans font-semibold text-white bg-white/10 border border-white/20"
        >
          <ChevronLeft />
          Back
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

      {/* Bottom — counter + scrubable thumbnails */}
      {total > 1 && (
        <div
          data-gallery-chrome
          className="pointer-events-auto absolute inset-x-0 bottom-0 px-4"
          style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
        >
          <p
            className="text-center font-mono text-white/70 mb-3"
            style={{ fontSize: '12px' }}
          >
            {activeIdx + 1} / {total}
          </p>
          <div className="mx-auto px-3 py-3 bg-white rounded-[14px]" style={{ maxWidth: '92vw' }}>
            <ScrubableThumbnailStrip
              images={images}
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
