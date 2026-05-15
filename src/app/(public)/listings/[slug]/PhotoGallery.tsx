'use client'

import { useState, useRef } from 'react'
import type { ListingImage } from '@/lib/types/database'

interface Props {
  images: ListingImage[]
  title: string
}

export default function PhotoGallery({ images, title }: Props) {
  const [activeIdx, setActiveIdx] = useState(0)
  const stripRef = useRef<HTMLDivElement>(null)

  const sorted = [...images].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1
    if (!a.is_primary && b.is_primary) return 1
    return a.sort_order - b.sort_order
  })

  const active = sorted[activeIdx]
  const total = sorted.length

  function scrollToStrip() {
    stripRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  if (total === 0) {
    return (
      <div className="w-full bg-[#F0F0F0] flex items-center justify-center" style={{ height: '400px' }}>
        <svg className="w-16 h-16 text-ink-3 opacity-25" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    )
  }

  return (
    <>
      {/* Hero image */}
      <div className="relative w-full overflow-hidden bg-[#1A1D20]" style={{ height: '400px' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={active.url}
          alt={active.alt_text ?? title}
          className="w-full h-full object-cover transition-opacity duration-200"
          key={active.id}
        />

        {/* Bottom-right overlay pills */}
        <div className="absolute bottom-3 right-4 flex items-center gap-2">
          {total > 1 && (
            <span
              className="text-xs font-mono text-white px-3 py-1 rounded-pill"
              style={{ background: 'rgba(26,29,32,0.75)' }}
            >
              {activeIdx + 1} / {total} photos
            </span>
          )}
          {total > 1 && (
            <button
              onClick={scrollToStrip}
              className="text-xs font-sans font-semibold text-white px-3 py-1 rounded-pill transition-opacity hover:opacity-80"
              style={{ background: 'rgba(26,29,32,0.75)' }}
            >
              View all
            </button>
          )}
        </div>
      </div>

      {/* Thumbnail strip */}
      {total > 1 && (
        <div
          ref={stripRef}
          className="bg-white border-b border-[#E8E9EA] overflow-x-auto"
          style={{ padding: '12px 32px' }}
        >
          <div className="flex items-center gap-2" style={{ width: 'max-content' }}>
            {sorted.map((img, idx) => (
              <button
                key={img.id}
                onClick={() => setActiveIdx(idx)}
                className="shrink-0 overflow-hidden transition-all"
                style={{
                  width: '72px',
                  height: '52px',
                  borderRadius: '8px',
                  border: `2px solid ${idx === activeIdx ? '#FF6B35' : 'transparent'}`,
                  outline: idx === activeIdx ? 'none' : undefined,
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
    </>
  )
}
