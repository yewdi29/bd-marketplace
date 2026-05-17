'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Listing } from '@/lib/types/database'
import { formatPrice } from '@/lib/utils'

interface ListingCardProps {
  listing: Listing
}

function isNewListing(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() < 7 * 24 * 60 * 60 * 1000
}

export default function ListingCard({ listing }: ListingCardProps) {
  const primaryImage = listing.listing_images?.find(img => img.is_primary) ?? listing.listing_images?.[0]
  const href = `/listings/${listing.slug ?? listing.id}`
  const isNew = isNewListing(listing.created_at)

  // Price visibility: only show "Contact for price" when price_visible is explicitly false
  const contactForPrice = listing.price_visible === false
  const showPrice = !contactForPrice && listing.price > 0

  // Location pill: "City, State, United States"
  const locationParts = [listing.location_city, listing.location_state].filter(Boolean)
  const locationText = locationParts.length > 0 ? [...locationParts, 'United States'].join(', ') : null

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
          {contactForPrice ? 'Contact for price' : showPrice ? formatPrice(listing.price) : null}
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
