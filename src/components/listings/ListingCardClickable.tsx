'use client'

import type { ReactNode } from 'react'
import ListingCardContent, { getListingCardMeta } from '@/components/listings/ListingCardContent'
import ListingCardFlagStyles from '@/components/listings/ListingCardFlagStyles'
import ListingCardSaveButton from '@/components/listings/ListingCardSaveButton'
import ListingCardShareButton from '@/components/listings/ListingCardShareButton'
import type { ListingCardListing } from '@/components/listings/listingCardTypes'

interface ListingCardClickableProps {
  listing: ListingCardListing
  initialSaved?: boolean
  isLoggedIn?: boolean
  onUnsave?: (listingId: string) => void
  onClick?: () => void
  showSave?: boolean
  showShare?: boolean
  disableHoverLift?: boolean
  thumbnailOverlay?: ReactNode
  imageClassName?: string
  priceMuted?: boolean
  footer?: ReactNode
  className?: string
}

/** Client wrapper for dashboard cards that need click handlers and callbacks. */
export default function ListingCardClickable({
  listing,
  initialSaved = false,
  isLoggedIn = false,
  onUnsave,
  onClick,
  showSave,
  showShare,
  disableHoverLift = false,
  thumbnailOverlay,
  imageClassName = '',
  priceMuted = false,
  footer,
  className = '',
}: ListingCardClickableProps) {
  const { href, priceDisplay, locationText, flagClass } = getListingCardMeta(listing)
  const showSaveButton = showSave ?? true
  const showShareButton = showShare ?? true

  const hoverMotion = disableHoverLift
    ? ''
    : 'transition-all duration-200 hover:-translate-y-0.5 shadow-card hover:shadow-card-hover'

  const cardClass = [
    `group block bg-white border border-[#E8E9EA] hover:border-[#D4D5D7] rounded-[12px] overflow-hidden ${hoverMotion} shadow-card`,
    onClick ? 'cursor-pointer' : '',
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

  return (
    <div
      className={cardClass}
      onClick={onClick}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      } : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {flagClass && <ListingCardFlagStyles />}
      <ListingCardContent
        listing={listing}
        mode="clickable"
        showNewBadge={false}
        priceMuted={priceMuted}
        imageClassName={imageClassName}
        thumbnailOverlay={thumbnailOverlay}
        footer={footer}
        actions={actions}
      />
    </div>
  )
}
