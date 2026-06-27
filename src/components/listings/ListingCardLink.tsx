'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import ListingCardContent, { getListingCardMeta } from '@/components/listings/ListingCardContent'
import ListingCardFlagStyles from '@/components/listings/ListingCardFlagStyles'
import ListingCardSaveButton from '@/components/listings/ListingCardSaveButton'
import ListingCardShareButton from '@/components/listings/ListingCardShareButton'
import type { ListingCardListing } from '@/components/listings/listingCardTypes'

interface ListingCardLinkProps {
  listing: ListingCardListing
  initialSaved?: boolean
  isLoggedIn?: boolean
  onUnsave?: (listingId: string) => void
  preview?: boolean
  mode?: 'link' | 'static'
  showSave?: boolean
  showShare?: boolean
  openInNewTab?: boolean
  disableHoverLift?: boolean
  thumbnailOverlay?: ReactNode
  imageClassName?: string
  priceMuted?: boolean
  footer?: ReactNode
  className?: string
}

/** Client listing card for browse pages — same markup as server ListingCard. */
export default function ListingCardLink({
  listing,
  initialSaved = false,
  isLoggedIn = false,
  onUnsave,
  preview = false,
  mode = 'link',
  showSave,
  showShare,
  openInNewTab = false,
  disableHoverLift = false,
  thumbnailOverlay,
  imageClassName = '',
  priceMuted = false,
  footer,
  className = '',
}: ListingCardLinkProps) {
  const { href, priceDisplay, locationText, flagClass } = getListingCardMeta(listing)
  const showSaveButton = showSave ?? (mode === 'link' && !preview)
  const showShareButton = showShare ?? !preview

  const hoverMotion = preview || disableHoverLift
    ? ''
    : 'transition-all duration-200 hover:-translate-y-0.5 shadow-card hover:shadow-card-hover'

  const cardClass = [
    preview
      ? 'block bg-white border border-[#E8E9EA] rounded-[12px] overflow-hidden shadow-card'
      : `group block bg-white border border-[#E8E9EA] hover:border-[#D4D5D7] rounded-[12px] overflow-hidden ${hoverMotion} shadow-card`,
    className,
  ].filter(Boolean).join(' ')

  const actions = (showSaveButton || showShareButton) ? (
    <>
      {showSaveButton && (
        <ListingCardSaveButton
          listingId={listing.id}
          isLoggedIn={isLoggedIn}
          initialSaved={initialSaved}
          onUnsave={onUnsave}
        />
      )}
      {showShareButton && (
        <ListingCardShareButton
          listingHref={href}
          title={listing.title}
          priceDisplay={priceDisplay}
          locationText={locationText}
        />
      )}
    </>
  ) : null

  const content = (
    <>
      {flagClass && <ListingCardFlagStyles />}
      <ListingCardContent
        listing={listing}
        preview={preview}
        mode={mode}
        priceMuted={priceMuted}
        imageClassName={imageClassName}
        thumbnailOverlay={thumbnailOverlay}
        footer={footer}
        actions={actions}
      />
    </>
  )

  if (preview || mode === 'static') {
    return <div className={cardClass}>{content}</div>
  }

  return (
    <Link
      href={href}
      className={cardClass}
      {...(openInNewTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {content}
    </Link>
  )
}
