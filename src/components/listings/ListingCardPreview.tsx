'use client'

import ListingCardContent from '@/components/listings/ListingCardContent'
import ListingCardFlagStyles from '@/components/listings/ListingCardFlagStyles'
import type { ListingCardListing } from '@/components/listings/listingCardTypes'
import { countryFlagClass } from '@/lib/listingUtils'

/** Client preview card for listing modals — static markup only. */
export default function ListingCardPreview({ listing }: { listing: ListingCardListing }) {
  const flagClass = countryFlagClass(listing.countries?.iso_code)

  return (
    <div className="block bg-white border border-[#E8E9EA] rounded-[12px] overflow-hidden shadow-card">
      {flagClass && <ListingCardFlagStyles />}
      <ListingCardContent listing={listing} preview showNewBadge={false} />
    </div>
  )
}
