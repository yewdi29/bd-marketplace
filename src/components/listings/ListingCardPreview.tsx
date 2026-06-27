'use client'

import ListingCardContent from '@/components/listings/ListingCardContent'
import type { ListingCardListing } from '@/components/listings/listingCardTypes'

/** Client preview card for listing modals — static markup only. */
export default function ListingCardPreview({ listing }: { listing: ListingCardListing }) {
  return (
    <div className="block bg-white border border-[#E8E9EA] rounded-[12px] overflow-hidden shadow-card">
      <ListingCardContent listing={listing} preview showNewBadge={false} />
    </div>
  )
}
