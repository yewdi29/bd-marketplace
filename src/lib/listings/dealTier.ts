export type DealTier = 'green' | 'yellow' | 'red'

/**
 * Traffic-light tier from listing price — matches public.set_listing_tier() trigger:
 * green < $100K, yellow < $500K, red otherwise.
 */
export function dealTierFromPrice(price: number): DealTier {
  if (!Number.isFinite(price) || price < 100_000) return 'green'
  if (price < 500_000) return 'yellow'
  return 'red'
}

/** Prefer stored listing.tier; if missing, derive from price so inquiry emails still route. */
export function resolveListingDealTier(listing: {
  tier?: string | null
  price?: number | string | null
}): DealTier {
  if (listing.tier === 'green' || listing.tier === 'yellow' || listing.tier === 'red') {
    return listing.tier
  }
  return dealTierFromPrice(Number(listing.price ?? 0))
}
