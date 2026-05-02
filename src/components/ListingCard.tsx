import Link from 'next/link'
import Image from 'next/image'
import { Listing } from '@/lib/types/database'
import { formatPrice } from '@/lib/utils'
import TierBadge from './TierBadge'

interface ListingCardProps {
  listing: Listing
}

export default function ListingCard({ listing }: ListingCardProps) {
  const primaryImage = listing.listing_images?.find(img => img.is_primary) ?? listing.listing_images?.[0]
  const href = `/listings/${listing.slug ?? listing.id}`

  return (
    <Link href={href} className="group block bg-surface border border-surface-border hover:border-gold/40 transition-all duration-200">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-elevated">
        {primaryImage ? (
          <Image
            src={primaryImage.url}
            alt={primaryImage.alt_text ?? listing.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
        )}

        {listing.featured && (
          <div className="absolute top-2 left-2 bg-gold px-2 py-0.5">
            <span className="font-display text-xs tracking-widest text-black">FEATURED</span>
          </div>
        )}

        {listing.tier && (
          <div className="absolute top-2 right-2">
            <TierBadge tier={listing.tier} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-xs font-body text-gray-500 uppercase tracking-widest mb-1">
          {listing.category.replace(/_/g, ' ')}
        </p>
        <h3 className="font-display text-lg tracking-wide text-white group-hover:text-gold transition-colors line-clamp-2 leading-tight">
          {listing.title}
        </h3>

        <div className="mt-2 flex items-center gap-2 text-xs font-body text-gray-500">
          {listing.manufacturer && <span>{listing.manufacturer}</span>}
          {listing.manufacturer && listing.year && <span>&middot;</span>}
          {listing.year && <span>{listing.year}</span>}
          {(listing.manufacturer || listing.year) && listing.condition && <span>&middot;</span>}
          {listing.condition && <span className="capitalize">{listing.condition.replace(/_/g, ' ')}</span>}
        </div>

        {(listing.location_city || listing.location_state) && (
          <p className="mt-1 text-xs font-body text-gray-600">
            {[listing.location_city, listing.location_state].filter(Boolean).join(', ')}
          </p>
        )}

        <div className="mt-3 flex items-center justify-between">
          <div>
            <span className="font-display text-xl tracking-wide text-gold">
              {formatPrice(listing.price)}
            </span>
            {listing.price_negotiable && (
              <span className="ml-2 text-xs font-body text-gray-500">Negotiable</span>
            )}
          </div>
          <span className="text-xs font-body text-gray-600">{listing.view_count} views</span>
        </div>
      </div>
    </Link>
  )
}
