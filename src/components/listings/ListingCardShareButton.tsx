'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { ShareIcon } from '@/components/listings/ListingSharePopover'

const ListingSharePopover = dynamic(
  () => import('@/components/listings/ListingSharePopover').then(mod => ({ default: mod.ListingSharePopover })),
  {
    ssr: false,
    loading: () => (
      <button
        type="button"
        aria-label="Share listing"
        className="gallery-action-pill w-8 h-8 rounded-full flex items-center justify-center transition-opacity"
      >
        <ShareIcon stroke="#9A9DA2" />
      </button>
    ),
  },
)

interface ListingCardShareButtonProps {
  listingHref: string
  title: string
  priceDisplay: string
  locationText: string | null
}

export default function ListingCardShareButton({
  listingHref,
  title,
  priceDisplay,
  locationText,
}: ListingCardShareButtonProps) {
  const [listingUrl, setListingUrl] = useState('')

  useEffect(() => {
    setListingUrl(`${window.location.origin}${listingHref}`)
  }, [listingHref])

  if (!listingUrl) {
    return (
      <button
        type="button"
        aria-label="Share listing"
        className="gallery-action-pill w-8 h-8 rounded-full flex items-center justify-center transition-opacity"
      >
        <ShareIcon stroke="#9A9DA2" />
      </button>
    )
  }

  return (
    <ListingSharePopover
      listingUrl={listingUrl}
      listingTitle={title}
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
  )
}
