'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, type ReactNode } from 'react'
import { formatPrice } from '@/lib/formatPrice'
import { ListingSharePopover, ShareIcon } from '@/components/listings/ListingSharePopover'

// Minimal shape the card actually renders — structurally compatible with both
// the full `Listing` type and the narrower row shape returned by /api/saved.
export interface ListingCardListing {
  id: string
  slug: string | null
  title: string
  category: string
  price: number
  price_unit: string
  price_visible: boolean | null
  location_city: string | null
  location_state: string | null
  created_at: string
  listing_images?: {
    url: string
    is_primary: boolean
    alt_text?: string | null
  }[]
  countries?: {
    name: string
    iso_code: string | null
  } | null
}

interface ListingCardProps {
  listing: ListingCardListing
  initialSaved?: boolean
  isLoggedIn?: boolean
  onUnsave?: (listingId: string) => void
  /** Static preview — no link, save button, or hover motion. */
  preview?: boolean
  /** link = public browse (default); clickable = dashboard card click; static = sold / non-interactive */
  mode?: 'link' | 'clickable' | 'static'
  onClick?: () => void
  showSave?: boolean
  /** Show share button on thumbnail (default: true when not preview). */
  showShare?: boolean
  /** Open listing detail in a new browser tab (default: false). */
  openInNewTab?: boolean
  disableHoverLift?: boolean
  /** Extra nodes over the thumbnail (status badge, sold overlay, external link hint). */
  thumbnailOverlay?: ReactNode
  /** Applied to the thumbnail image (e.g. sold grayscale). */
  imageClassName?: string
  /** Muted price styling for sold cards. */
  priceMuted?: boolean
  /** Slot below card body (e.g. dashboard Manage button). */
  footer?: ReactNode
  className?: string
}

function isNewListing(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() < 7 * 24 * 60 * 60 * 1000
}

function countryFlagClass(isoCode: string | null | undefined): string | null {
  if (!isoCode) return null
  const code = isoCode.trim().toLowerCase()
  if (!/^[a-z]{2}$/.test(code)) return null
  return `fi fis fi-${code}`
}

export default function ListingCard({
  listing,
  initialSaved = false,
  isLoggedIn = false,
  onUnsave,
  preview = false,
  mode = 'link',
  onClick,
  showSave,
  showShare,
  openInNewTab = false,
  disableHoverLift = false,
  thumbnailOverlay,
  imageClassName = '',
  priceMuted = false,
  footer,
  className = '',
}: ListingCardProps) {
  const [saved, setSaved] = useState(initialSaved)
  const [saving, setSaving] = useState(false)
  const [listingUrl, setListingUrl] = useState('')

  const primaryImage = listing.listing_images?.find(img => img.is_primary) ?? listing.listing_images?.[0]
  const href = `/listings/${listing.slug ?? listing.id}`
  const isNew = isNewListing(listing.created_at)
  const showSaveButton = showSave ?? (mode === 'link' && !preview)
  const showShareButton = showShare ?? !preview

  useEffect(() => {
    setListingUrl(`${window.location.origin}${href}`)
  }, [href])

  const priceDisplay = formatPrice(listing.price, listing.price_unit ?? 'total', listing.price_visible ?? true)

  const locationParts = [
    listing.location_city,
    listing.location_state,
    listing.countries?.name,
  ].filter(Boolean)
  const locationText = locationParts.length > 0 ? locationParts.join(', ') : null
  const flagClass = countryFlagClass(listing.countries?.iso_code)

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
      if (res.ok) {
        setSaved(s => !s)
        if (saved) onUnsave?.(listing.id)
      }
    } finally {
      setSaving(false)
    }
  }

  const hoverMotion = preview || disableHoverLift
    ? ''
    : 'transition-all duration-200 hover:-translate-y-0.5 shadow-card hover:shadow-card-hover'

  const cardClass = [
    preview
      ? 'block bg-white border border-[#E8E9EA] rounded-[12px] overflow-hidden shadow-card'
      : `group block bg-white border border-[#E8E9EA] hover:border-[#D4D5D7] rounded-[12px] overflow-hidden ${hoverMotion} shadow-card`,
    mode === 'clickable' && onClick ? 'cursor-pointer' : '',
    className,
  ].filter(Boolean).join(' ')

  const imageCoverClass = ['absolute inset-0 w-full h-full object-cover', imageClassName].filter(Boolean).join(' ')

  const cardInner = (
    <>
      {/* Thumbnail — height = 60% of card width (225px base → 135px) */}
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
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 33vw, 225px"
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

        {/* New Listing badge — only if listed within last 7 days */}
        {!preview && isNew && mode === 'link' && (
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

        {/* Save + share — top right of thumbnail */}
        {(showShareButton || showSaveButton) && (
          <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5">
            {showSaveButton && (
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                aria-label={saved ? 'Remove from saved' : 'Save listing'}
                className="gallery-action-pill w-8 h-8 rounded-full flex items-center justify-center transition-opacity disabled:opacity-50"
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
            )}

            {showShareButton && listingUrl && (
              <ListingSharePopover
                listingUrl={listingUrl}
                listingTitle={listing.title}
                listingPrice={priceDisplay}
                listingLocation={locationText}
                trigger={
                  <button
                    type="button"
                    aria-label="Share listing"
                    className="gallery-action-pill w-8 h-8 rounded-full flex items-center justify-center transition-opacity"
                  >
                    <ShareIcon stroke="#9A9DA2" />
                  </button>
                }
              />
            )}
          </div>
        )}
      </div>

      {/* Card body */}
      <div style={{ padding: '10px' }}>
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
              padding: '3px 10px 3px 3px',
              gap: '7px',
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

  if (preview || mode === 'static') {
    return <div className={cardClass}>{cardInner}</div>
  }

  if (mode === 'clickable') {
    return (
      <div
        className={cardClass}
        onClick={onClick}
        onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } } : undefined}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
      >
        {cardInner}
      </div>
    )
  }

  return (
    <Link
      href={href}
      className={cardClass}
      {...(openInNewTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {cardInner}
    </Link>
  )
}

/** Map dashboard API row → shared card listing shape. */
export function toListingCardListing(input: {
  id: string
  slug: string | null
  title: string
  category: string
  price: number
  price_unit: string
  price_visible: boolean | null
  location_city: string | null
  location_state: string | null
  created_at: string
  primary_image_url?: string | null
  listing_images?: ListingCardListing['listing_images']
  countries?: ListingCardListing['countries']
}): ListingCardListing {
  return {
    id: input.id,
    slug: input.slug,
    title: input.title,
    category: input.category,
    price: input.price,
    price_unit: input.price_unit,
    price_visible: input.price_visible,
    location_city: input.location_city,
    location_state: input.location_state,
    created_at: input.created_at,
    countries: input.countries,
    listing_images: input.listing_images ?? (
      input.primary_image_url
        ? [{ url: input.primary_image_url, is_primary: true }]
        : []
    ),
  }
}
