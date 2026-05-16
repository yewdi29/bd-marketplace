'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Listing } from '@/lib/types/database'
import { formatPrice } from '@/lib/utils'

interface ListingCardProps {
  listing: Listing
}

export default function ListingCard({ listing }: ListingCardProps) {
  const primaryImage = listing.listing_images?.find(img => img.is_primary) ?? listing.listing_images?.[0]
  const href = `/listings/${listing.slug ?? listing.id}`

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
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-10 h-10 text-ink-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
        )}

        {/* Save button */}
        <button
          className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.12)' }}
          onClick={e => e.preventDefault()}
          aria-label="Save listing"
        >
          <svg className="w-3.5 h-3.5 text-ink-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        {/* Badges row */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {listing.featured && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill bg-orange-bg border border-orange-bdr text-[11px] font-mono font-bold text-orange">
              <span className="w-1.5 h-1.5 rounded-full bg-orange" />
              BD Verified
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Category */}
        <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-3 mb-1.5">
          {listing.category.replace(/_/g, ' ')}
        </p>

        {/* Title + Price on same row */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="font-sans text-[15px] font-semibold text-ink leading-snug line-clamp-2 flex-1">
            {listing.title}
          </h3>
          {listing.price_visible !== false && listing.price > 0 ? (
            <span className="font-mono text-[15px] font-medium text-ink tracking-tight shrink-0">
              {formatPrice(listing.price)}
            </span>
          ) : (
            <span className="text-[12px] font-sans text-ink-3 italic shrink-0">Contact for price</span>
          )}
        </div>

        {/* Location + Condition */}
        <div className="flex items-center gap-2 text-[13px] font-sans text-ink-3">
          {(listing.location_city || listing.location_state) && (
            <span>{[listing.location_city, listing.location_state].filter(Boolean).join(', ')}</span>
          )}
          {(listing.location_city || listing.location_state) && listing.condition && (
            <span className="text-[#E8E9EA]">·</span>
          )}
          {listing.condition && (
            <span className="capitalize">{listing.condition.replace(/_/g, ' ')}</span>
          )}
        </div>

        {/* Tags row */}
        {(listing.manufacturer || listing.year || listing.price_negotiable) && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {listing.manufacturer && (
              <span className="px-2 py-0.5 bg-bg border border-[#E8E9EA] rounded-pill text-[11px] font-sans text-ink-3">
                {listing.manufacturer}
              </span>
            )}
            {listing.year && (
              <span className="px-2 py-0.5 bg-bg border border-[#E8E9EA] rounded-pill text-[11px] font-sans text-ink-3">
                {listing.year}
              </span>
            )}
            {listing.price_negotiable && (
              <span className="px-2 py-0.5 bg-bg border border-[#E8E9EA] rounded-pill text-[11px] font-sans text-ink-3">
                Negotiable
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
