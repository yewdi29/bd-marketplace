'use client'

import { muxThumbnailUrl } from '@/lib/listings/listingVideoUploadClient'
import type { PublicGalleryItem } from '@/lib/listings/publicGallery'

function PlayBadge() {
  return (
    <span
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      aria-hidden
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
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
  size?: number
}

export default function GalleryThumbnailStrip({
  items,
  activeIdx,
  onSelect,
  size = 64,
}: Props) {
  return (
    <div
      className="flex gap-2 overflow-x-auto"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
    >
      {items.map((item, idx) => {
        const active = idx === activeIdx
        const label = item.kind === 'photo' ? `View photo ${idx + 1}` : `View video ${idx + 1}`

        return (
          <button
            key={`${item.kind}:${item.id}`}
            onClick={e => { e.stopPropagation(); onSelect(idx) }}
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
                className="h-full w-full object-cover"
                style={{ borderRadius: '6px' }}
              />
            ) : (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={muxThumbnailUrl(item.mux_playback_id)}
                  alt={`Video ${idx + 1}`}
                  className="h-full w-full object-cover"
                  style={{ borderRadius: '6px' }}
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
