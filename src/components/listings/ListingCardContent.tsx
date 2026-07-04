import Image from 'next/image'
import type { ReactNode } from 'react'
import { formatPrice } from '@/lib/formatPrice'
import { countryFlagClass, isNewListing } from '@/lib/listingUtils'
import type { ListingCardListing } from '@/components/listings/listingCardTypes'

export interface ListingCardContentProps {
  listing: ListingCardListing
  preview?: boolean
  mode?: 'link' | 'clickable' | 'static'
  showNewBadge?: boolean
  priceMuted?: boolean
  imageClassName?: string
  /** LCP / above-the-fold — skip lazy loading for thumbnail. */
  imagePriority?: boolean
  thumbnailOverlay?: ReactNode
  footer?: ReactNode
  actions?: ReactNode
}

export default function ListingCardContent({
  listing,
  preview = false,
  mode = 'link',
  showNewBadge = true,
  priceMuted = false,
  imageClassName = '',
  imagePriority = false,
  thumbnailOverlay,
  footer,
  actions,
}: ListingCardContentProps) {
  const primaryImage =
    listing.listing_images?.find(img => img.is_primary) ?? listing.listing_images?.[0]
  const isNew = isNewListing(listing.created_at)
  const priceDisplay = formatPrice(
    listing.price,
    listing.price_unit ?? 'total',
    listing.price_visible ?? true,
  )

  const locationParts = [
    listing.location_city,
    listing.location_state,
    listing.countries?.name,
  ].filter(Boolean)
  const locationText = locationParts.length > 0 ? locationParts.join(', ') : null
  const flagClass = countryFlagClass(listing.countries?.iso_code)

  const imageCoverClass = ['absolute inset-0 w-full h-full object-cover', imageClassName]
    .filter(Boolean)
    .join(' ')

  return (
    <>
      <div
        className="relative w-full bg-bg overflow-hidden"
        style={{ paddingBottom: '60%', borderRadius: '12px 12px 0 0' }}
      >
        {primaryImage ? (
          preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={primaryImage.url}
              alt={primaryImage.alt_text ?? listing.title}
              className={imageCoverClass}
            />
          ) : (
            <Image
              src={primaryImage.url}
              alt={primaryImage.alt_text ?? listing.title}
              fill
              className={imageCoverClass}
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              priority={imagePriority}
            />
          )
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[#F0F0F0]">
            <svg className="w-10 h-10 text-ink-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
        )}

        {thumbnailOverlay}

        {!preview && showNewBadge && isNew && mode === 'link' && (
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

        {actions && (
          <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5">
            {actions}
          </div>
        )}
      </div>

      <div style={{ padding: '17px' }}>
        <p className="font-mono text-[12px] uppercase tracking-[0.08em] text-ink-3 mb-1.5">
          {listing.category.replace(/_/g, ' ')}
        </p>

        <h3
          className="font-sans text-ink line-clamp-2 mb-1.5"
          style={{ fontSize: '13px', fontWeight: 500, lineHeight: 1.35 }}
        >
          {listing.title}
        </h3>

        <p
          className={`font-mono mb-3${priceMuted ? ' text-ink-3' : ''}`}
          style={{
            fontSize: '14px',
            fontWeight: 500,
            color: priceMuted ? undefined : '#FF6B35',
          }}
        >
          {priceDisplay}
        </p>

        {locationText && (
          <span
            className="inline-flex items-center font-sans"
            style={{
              background: '#F7F8F9',
              border: '1px solid #E8E9EA',
              color: '#4A4D52',
              fontSize: '11px',
              borderRadius: '100px',
              padding: '3px 10px',
              gap: flagClass ? '7px' : undefined,
            }}
          >
            {flagClass && (
              <span
                className="inline-flex shrink-0 overflow-hidden border border-[#E8E9EA]"
                style={{ width: 17, height: 17, borderRadius: '50%' }}
                aria-hidden="true"
              >
                <span
                  className={flagClass}
                  style={{ width: 17, height: 17, objectFit: 'cover', backgroundSize: 'cover' }}
                />
              </span>
            )}
            {locationText}
          </span>
        )}
      </div>

      {footer}
    </>
  )
}

export function getListingCardMeta(listing: ListingCardListing) {
  const href = `/listings/${listing.slug ?? listing.id}`
  const priceDisplay = formatPrice(
    listing.price,
    listing.price_unit ?? 'total',
    listing.price_visible ?? true,
  )
  const locationParts = [
    listing.location_city,
    listing.location_state,
    listing.countries?.name,
  ].filter(Boolean)
  const locationText = locationParts.length > 0 ? locationParts.join(', ') : null
  const flagClass = countryFlagClass(listing.countries?.iso_code)

  return { href, priceDisplay, locationText, flagClass }
}
