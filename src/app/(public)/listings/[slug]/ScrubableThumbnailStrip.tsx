'use client'

import { useEffect, useRef } from 'react'
import { muxThumbnailUrl } from '@/lib/listings/listingVideoUploadClient'
import type { PublicGalleryItem } from '@/lib/listings/publicGallery'

const GAP_PX = 8

function normalizeIndex(idx: number, length: number) {
  if (length <= 0) return 0
  return ((idx % length) + length) % length
}

function PlayBadge() {
  return (
    <span className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden>
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black/55 text-white">
        <svg width="8" height="8" viewBox="0 0 10 10" fill="currentColor">
          <path d="M2 1.5v7l6-3.5-6-3.5z" />
        </svg>
      </span>
    </span>
  )
}

interface Props {
  items: PublicGalleryItem[]
  activeIdx: number
  onSelect: (idx: number) => void
  onScrub: (idx: number) => void
  size?: number
}

export default function ScrubableThumbnailStrip({
  items,
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

  useEffect(() => {
    if (scrubbingRef.current) return
    const el = thumbRefs.current[activeIdx]
    el?.scrollIntoView({ inline: 'center', behavior: 'instant', block: 'nearest' })
    lastEmittedIdx.current = activeIdx
  }, [activeIdx])

  function emitIndexFromScroll() {
    if (!scrubbingRef.current) return

    const container = scrollRef.current
    if (!container) return
    const center = container.scrollLeft + container.clientWidth / 2
    const raw = Math.round((center - size / 2) / stride)
    const idx = normalizeIndex(raw, items.length)
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
      {items.map((item, idx) => {
        const active = idx === activeIdx
        const label = item.kind === 'photo' ? `View photo ${idx + 1}` : `View video ${idx + 1}`

        return (
          <button
            key={`${item.kind}:${item.id}`}
            ref={el => { thumbRefs.current[idx] = el }}
            type="button"
            onClick={e => {
              e.stopPropagation()
              onSelect(idx)
            }}
            aria-label={label}
            className="relative shrink-0 bg-white transition-colors"
            style={{
              width: size,
              height: size,
              borderRadius: '10px',
              padding: '4px',
              border: `2px solid ${active ? '#FF6B35' : '#E8E9EA'}`,
            }}
          >
            {item.kind === 'photo' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.url}
                alt={item.alt_text ?? `Photo ${idx + 1}`}
                className="h-full w-full object-cover pointer-events-none"
                style={{ borderRadius: '6px' }}
                draggable={false}
              />
            ) : (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={muxThumbnailUrl(item.mux_playback_id)}
                  alt={`Video ${idx + 1}`}
                  className="h-full w-full object-cover pointer-events-none"
                  style={{ borderRadius: '6px' }}
                  draggable={false}
                />
                <PlayBadge />
              </>
            )}
          </button>
        )
      })}
    </div>
  )
}
