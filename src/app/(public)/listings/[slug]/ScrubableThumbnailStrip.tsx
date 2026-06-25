'use client'

import { useEffect, useRef } from 'react'
import type { ListingImage } from '@/lib/types/database'

const GAP_PX = 8

function normalizeIndex(idx: number, length: number) {
  if (length <= 0) return 0
  return ((idx % length) + length) % length
}

interface Props {
  images: ListingImage[]
  activeIdx: number
  onSelect: (idx: number) => void
  onScrub: (idx: number) => void
  size?: number
}

export default function ScrubableThumbnailStrip({
  images,
  activeIdx,
  onSelect,
  onScrub,
  size = 56,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([])
  const scrubbingRef = useRef(false)
  const lastEmittedIdx = useRef(activeIdx)

  const stride = size + GAP_PX

  // Keep active thumb centered when the main viewer changes (image swipe).
  useEffect(() => {
    if (scrubbingRef.current) return
    const el = thumbRefs.current[activeIdx]
    el?.scrollIntoView({ inline: 'center', behavior: 'instant', block: 'nearest' })
    lastEmittedIdx.current = activeIdx
  }, [activeIdx])

  function emitIndexFromScroll() {
    // Only scrub the main viewer when the user is actively dragging the strip.
    // Programmatic scrollIntoView (from swipe sync) also fires onScroll and was
    // pulling PhotoSwipe back — e.g. capping navigation around image 5.
    if (!scrubbingRef.current) return

    const container = scrollRef.current
    if (!container) return
    const center = container.scrollLeft + container.clientWidth / 2
    const raw = Math.round((center - size / 2) / stride)
    const idx = normalizeIndex(raw, images.length)
    if (idx !== lastEmittedIdx.current) {
      lastEmittedIdx.current = idx
      onScrub(idx)
    }
  }

  return (
    <div
      ref={scrollRef}
      data-gallery-thumb-strip
      data-gallery-overlay-scroll
      className="flex gap-2 overflow-x-auto no-scrollbar"
      style={{ touchAction: 'pan-x', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
      onScroll={emitIndexFromScroll}
      onTouchStart={() => { scrubbingRef.current = true }}
      onTouchEnd={() => { scrubbingRef.current = false }}
      onMouseDown={() => { scrubbingRef.current = true }}
      onMouseUp={() => { scrubbingRef.current = false }}
    >
      {images.map((img, idx) => {
        const active = idx === activeIdx
        return (
          <button
            key={img.id}
            ref={el => { thumbRefs.current[idx] = el }}
            type="button"
            onClick={e => {
              e.stopPropagation()
              onSelect(idx)
            }}
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
              className="w-full h-full object-cover pointer-events-none"
              style={{ borderRadius: '6px' }}
              draggable={false}
            />
          </button>
        )
      })}
    </div>
  )
}
