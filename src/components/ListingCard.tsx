'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Listing } from '@/lib/types/database'
import { formatPrice } from '@/lib/formatPrice'

interface ListingCardProps {
  listing: Listing
  initialSaved?: boolean
  isLoggedIn?: boolean
}

function isNewListing(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() < 7 * 24 * 60 * 60 * 1000
}

export default function ListingCard({ listing, initialSaved = false, isLoggedIn = false }: ListingCardProps) {
  const [saved, setSaved] = useState(initialSaved)
  const [saving, setSaving] = useState(false)

  const primaryImage = listing.listing_images?.find(img => img.is_primary) ?? listing.listing_images?.[0]
  const href = `/listings/${listing.slug ?? listing.id}`
  const isNew = isNewListing(listing.created_at)

  const priceDisplay = formatPrice(listing.price, listing.price_unit ?? 'total', listing.price_visible)

  const locationParts = [listing.location_city, listing.location_state].filter(Boolean)
  const locationText = locationParts.length > 0 ? [...locationParts, 'United States'].join(', ') : null

  async function handleSave(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!isLoggedIn) {
      window.location.href = `/auth/login?redirectTo=${encodeURIComponent(window.location.pathname)}`
      return
    }
    setSaving(true)
    try {
      const method = saved ? 'DELETE' : 'POST'
      const res = await fetch(`/api/saved/${listing.id}`, { method })
      if (res.ok) setSaved(s => !s)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Link
      href={href}
      className="group block bg-white border border-[#E8E9EA] hover:border-[#D4D5D7] rounded-[16px] overflow-hidden transition-all duration-200 hover:-translate-y-0.5 shadow-card hover:shadow-card-hover"
    >
      {/* Image area */}
      <div className="relative aspect-[4/3] bg-bg overflow-hidden">
        {primaryImage ? (
          <Image
            src={primaryImage.url}
            alt={primaryImage.alt_text ?? listing.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-10 h-10 text-ink-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
        )}

        {/* New Listing badge — only if listed within last 7 days */}
        {isNew && (
          <span
            className="absolute top-2 left-2 font-mono font-bold"
            style={{
              background: '#FFF2ED',
              border: '1px solid #FF6B35',
              color: '#FF6B35',
              fontSize: '10px',
              borderRadius: '100px',
              padding: '3px 10px',
            }}
          >
            New Listing
          </span>
        )}

        {/* Heart save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          aria-label={saved ? 'Remove from saved' : 'Save listing'}
          className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center transition-opacity disabled:opacity-50"
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
        >
          <svg
            className="w-4 h-4"
            fill={saved ? '#CC0000' : 'none'}
            viewBox="0 0 24 24"
            stroke={saved ? '#CC0000' : '#9A9DA2'}
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>

      {/* Card body */}
      <div className="p-4">
        {/* Category */}
        <p className="font-mono text-[12px] uppercase tracking-[0.08em] text-ink-3 mb-1.5">
          {listing.category.replace(/_/g, ' ')}
        </p>

        {/* Title */}
        <h3
          className="font-sans font-semibold text-ink line-clamp-2 mb-1.5"
          style={{ fontSize: '13px', lineHeight: 1.4 }}
        >
          {listing.title}
        </h3>

        {/* Price */}
        <p className="font-mono font-medium text-orange mb-3" style={{ fontSize: '15px' }}>
          {priceDisplay}
        </p>

        {/* Location pill */}
        {locationText && (
          <span
            className="inline-block font-sans"
            style={{
              background: '#F7F8F9',
              border: '1px solid #E8E9EA',
              color: '#4A4D52',
              fontSize: '11px',
              borderRadius: '100px',
              padding: '3px 10px',
            }}
          >
            {locationText}
          </span>
        )}
      </div>
    </Link>
  )
}
