import ListingCard from '@/components/ListingCard'
import type { Listing } from '@/lib/types/database'

interface FeaturedCarouselProps {
  listings: Listing[]
  isLoggedIn: boolean
  savedIds: string[]
}

export default function FeaturedCarousel({ listings, isLoggedIn, savedIds }: FeaturedCarouselProps) {
  if (!listings.length) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {listings.map(listing => (
        <ListingCard
          key={listing.id}
          listing={listing}
          isLoggedIn={isLoggedIn}
          initialSaved={savedIds.includes(listing.id)}
        />
      ))}
    </div>
  )
}
