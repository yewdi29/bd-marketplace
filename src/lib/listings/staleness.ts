/** Days without a freshness update before an active listing is considered stale. */
export const STALE_LISTING_THRESHOLD_DAYS = 15

const MS_PER_DAY = 24 * 60 * 60 * 1000

/**
 * Public marketplace "Newest" sort uses `created_at` (see FilterBar / listings API).
 * Staleness and relist use `updated_at` so relisting resets the seller nudge clock
 * without changing the New Listing badge (also derived from `created_at`).
 */
export function isStaleActiveListing(status: string, updatedAt: string | null | undefined): boolean {
  if (status !== 'active' || !updatedAt) return false
  return Date.now() - new Date(updatedAt).getTime() > STALE_LISTING_THRESHOLD_DAYS * MS_PER_DAY
}
