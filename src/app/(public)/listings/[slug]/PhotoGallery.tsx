'use client'

import { useState } from 'react'
import type { ListingImage } from '@/lib/types/database'

interface Props {
  images: ListingImage[]
  title: string
}

export default function PhotoGallery({ images, title }: Props) {
  const [activeIdx, setActiveIdx] = useState(0)

  const sorted = [...images].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1
    if (!a.is_primary && b.is_primary) return 1
    return a.sort_order - b.sort_order
  })

  const active = sorted[activeIdx]
  const total = sorted.length

  // ── No photos placeholder ───────────────────────────────────────────────────
  if (total === 0) {
    return (
      <div
        className="w-full bg-[#F0F0F0] rounded-[16px] flex flex-col items-center justify-center gap-3"
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
      </div>
    )
  }

  // ── Gallery ─────────────────────────────────────────────────────────────────
  return (
    <div className="w-full">
      {/* Hero image */}
      <div
        className="relative w-full overflow-hidden rounded-[16px] bg-[#F0F0F0]"
        style={{ aspectRatio: '4/3' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={active.url}
          alt={active.alt_text ?? title}
          key={active.id}
          className="w-full h-full object-cover transition-opacity duration-150"
        />

        {/* Photo count pill — bottom-right */}
        {total > 1 && (
          <div
            className="absolute bottom-3 right-3 font-mono text-white"
            style={{
              fontSize: '11px',
              background: 'rgba(26,29,32,0.72)',
              padding: '4px 10px',
              borderRadius: '100px',
            }}
          >
            {activeIdx + 1} / {total}
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {total > 1 && (
        <div
          className="mt-2 overflow-x-auto"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
        >
          <div className="flex gap-1.5" style={{ width: 'max-content' }}>
            {sorted.map((img, idx) => (
              <button
                key={img.id}
                onClick={() => setActiveIdx(idx)}
                className="shrink-0 overflow-hidden transition-all"
                style={{
                  width: '68px',
                  height: '50px',
                  borderRadius: '8px',
                  border: `2px solid ${idx === activeIdx ? '#FF6B35' : 'transparent'}`,
                  outline: 'none',
                  boxShadow: idx === activeIdx ? '0 0 0 1px #FF6B35' : 'none',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.alt_text ?? `Photo ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
