'use client'

import { createElement, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { createPortal } from 'react-dom'
import PhotoSwipe from 'photoswipe'
import 'photoswipe/style.css'
import ScrubableThumbnailStrip from './ScrubableThumbnailStrip'
import GalleryMuxPlayer from '@/components/listings/GalleryMuxPlayer'
import { publicGalleryItemKey, type PublicGalleryItem } from '@/lib/listings/publicGallery'

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

interface MuxSlideData {
  width: number
  height: number
  html: string
  muxPlaybackId: string
}

interface PhotoSlideData {
  src: string
  width: number
  height: number
  alt: string
}

type GallerySlideData = PhotoSlideData | MuxSlideData

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

function buildDataSource(items: PublicGalleryItem[], title: string): GallerySlideData[] {
  return items.map(item => {
    if (item.kind === 'photo') {
      return {
        src: item.url,
        width: 1600,
        height: 1200,
        alt: item.alt_text ?? title,
      }
    }

    return {
      width: 1600,
      height: 900,
      html: '<div class="pswp-mux-host" style="width:100%;height:100%;"></div>',
      muxPlaybackId: item.mux_playback_id,
    }
  })
}

function isMuxSlideData(data: GallerySlideData): data is MuxSlideData {
  return 'muxPlaybackId' in data
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
  const videoRootsRef = useRef<Map<number, Root>>(new Map())
  const titleRef = useRef(title)

  const itemsKey = useMemo(
    () => items.map(item => publicGalleryItemKey(item)).join('|'),
    [items],
  )

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { onIndexChangeRef.current = onIndexChange }, [onIndexChange])
  useEffect(() => { onCloseRef.current = onClose }, [onClose])
  useEffect(() => { uiVisibleRef.current = uiVisible }, [uiVisible])
  useEffect(() => { titleRef.current = title }, [title])

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
    if (!open || !mounted || items.length === 0) return

    setUiVisible(false)

    const dataSource = buildDataSource(items, titleRef.current)
    const startIndex = normalizeIndex(initialIndex, items.length)
    const videoRoots = videoRootsRef.current

    const mountMuxSlide = (contentIndex: number, container: HTMLElement, playbackId: string) => {
      if (container.dataset.muxMounted === '1') return
      container.dataset.muxMounted = '1'
      container.style.width = '100%'
      container.style.height = '100%'
      container.style.display = 'flex'
      container.style.alignItems = 'center'
      container.style.justifyContent = 'center'

      const existing = videoRoots.get(contentIndex)
      existing?.unmount()

      const root = createRoot(container)
      root.render(
        createElement(GalleryMuxPlayer, {
          playbackId,
          title: titleRef.current,
          objectFit: 'contain',
          className: 'h-full w-full max-h-full max-w-full',
        }),
      )
      videoRoots.set(contentIndex, root)
    }

    const unmountMuxSlide = (contentIndex: number) => {
      const root = videoRoots.get(contentIndex)
      if (!root) return
      root.unmount()
      videoRoots.delete(contentIndex)
    }

    const pswp = new PhotoSwipe({
      dataSource,
      index: startIndex,
      loop: items.length > 2,
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
        if (target?.closest('mux-player')) return
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
          bottom: showChrome && items.length > 1 ? 132 : 12,
          left: 0,
          right: 0,
        }
      },
    })

    pswp.on('contentAppend', ({ content }) => {
      const data = content.data as GallerySlideData
      if (!isMuxSlideData(data) || !content.element) return
      const host = content.element.querySelector('.pswp-mux-host')
      if (!(host instanceof HTMLElement)) return
      mountMuxSlide(content.index, host, data.muxPlaybackId)
    })

    pswp.on('contentDestroy', ({ content }) => {
      const data = content.data as GallerySlideData
      if (!isMuxSlideData(data)) return
      unmountMuxSlide(content.index)
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
      videoRoots.forEach(root => root.unmount())
      videoRoots.clear()
      pswp.destroy()
      pswpRef.current = null
    }
    // Only re-init when the lightbox opens/closes or the media set changes — not on swipe index updates.
  }, [open, mounted, itemsKey, items.length])

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

  const total = items.length

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
  )

  return createPortal(chrome, document.body)
}
