import Link from 'next/link'
import type { ReactNode } from 'react'
import ListingCardContent, { getListingCardMeta } from '@/components/listings/ListingCardContent'
import ListingCardFlagStyles from '@/components/listings/ListingCardFlagStyles'
import ListingCardSaveButton from '@/components/listings/ListingCardSaveButton'
import ListingCardShareButton from '@/components/listings/ListingCardShareButton'
import type { ListingCardListing } from '@/components/listings/listingCardTypes'

export type { ListingCardListing } from '@/components/listings/listingCardTypes'
export { toListingCardListing } from '@/components/listings/listingCardTypes'

interface ListingCardProps {
  listing: ListingCardListing
  initialSaved?: boolean
  isLoggedIn?: boolean
  /** Static preview — no link, save button, or hover motion. */
  preview?: boolean
  /** link = public browse (default); static = sold / non-interactive */
  mode?: 'link' | 'static'
  showSave?: boolean
  /** Show share button on thumbnail (default: true when not preview). */
  showShare?: boolean
  /** Open listing detail in a new browser tab (default: false). */
  openInNewTab?: boolean
  disableHoverLift?: boolean
  /** Extra nodes over the thumbnail (status badge, sold overlay). */
  thumbnailOverlay?: ReactNode
  /** Applied to the thumbnail image (e.g. sold grayscale). */
  imageClassName?: string
  /** LCP / above-the-fold — eager-load thumbnail at full resolution. */
  imagePriority?: boolean
  /** Muted price styling for sold cards. */
  priceMuted?: boolean
  /** Slot below card body (e.g. dashboard Manage button). */
  footer?: ReactNode
  className?: string
}

function buildCardActions({
  listing,
  href,
  priceDisplay,
  locationText,
  isLoggedIn,
  initialSaved,
  showSave,
  showShare,
}: {
  listing: ListingCardListing
  href: string
  priceDisplay: string
  locationText: string | null
  isLoggedIn: boolean
  initialSaved: boolean
  showSave: boolean
  showShare: boolean
}) {
  if (!showSave && !showShare) return null

  return (
    <>
      {showSave && (
        <ListingCardSaveButton
          listingId={listing.id}
          isLoggedIn={isLoggedIn}
          initialSaved={initialSaved}
        />
      )}
      {showShare && (
        <ListingCardShareButton
          listingHref={href}
          title={listing.title}
          priceDisplay={priceDisplay}
          locationText={locationText}
        />
      )}
    </>
  )
}

/** Server-rendered listing card — save/share hydrate as small client islands. */
export default function ListingCard({
  listing,
  initialSaved = false,
  isLoggedIn = false,
  preview = false,
  mode = 'link',
  showSave,
  showShare,
  openInNewTab = false,
  disableHoverLift = false,
  thumbnailOverlay,
  imageClassName = '',
  imagePriority = false,
  priceMuted = false,
  footer,
  className = '',
}: ListingCardProps) {
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

  const actions = buildCardActions({
    listing,
    href,
    priceDisplay,
    locationText,
    isLoggedIn,
    initialSaved,
    showSave: showSaveButton,
    showShare: showShareButton,
  })

  const content = (
    <>
      {flagClass && <ListingCardFlagStyles />}
      <ListingCardContent
        listing={listing}
        preview={preview}
        mode={mode}
        priceMuted={priceMuted}
        imageClassName={imageClassName}
        imagePriority={imagePriority}
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
