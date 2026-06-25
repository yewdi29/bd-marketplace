import ListingCard from '@/components/ListingCard'
import ListingCardGrid from '@/components/listings/ListingCardGrid'
import type { Listing } from '@/lib/types/database'

interface FeaturedCarouselProps {
  listings: Listing[]
  isLoggedIn: boolean
  savedIds: string[]
}

export default function FeaturedCarousel({ listings, isLoggedIn, savedIds }: FeaturedCarouselProps) {
  if (!listings.length) return null

  return (
    <ListingCardGrid>
      {listings.map(listing => (
        <ListingCard
          key={listing.id}
          listing={listing}
          isLoggedIn={isLoggedIn}
          initialSaved={savedIds.includes(listing.id)}
        />
      ))}
    </ListingCardGrid>
  )
}
