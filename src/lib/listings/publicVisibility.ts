/** Listing statuses that remain publicly reachable at /listings/[slug]. */
export const PUBLICLY_VIEWABLE_LISTING_STATUSES = ['active', 'sold'] as const

export type PubliclyViewableListingStatus =
  (typeof PUBLICLY_VIEWABLE_LISTING_STATUSES)[number]

export function isPubliclyViewableListingStatus(
  status: string,
): status is PubliclyViewableListingStatus {
  return (PUBLICLY_VIEWABLE_LISTING_STATUSES as readonly string[]).includes(status)
}
