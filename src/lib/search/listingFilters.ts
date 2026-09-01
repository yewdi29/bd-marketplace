/**
 * Shared active-listing filter helpers used by /api/listings and search SEO metadata.
 * Keeps industry/category filtering identical to the public search grid.
 */

export type ListingFilterIds = {
  industryIds: string[]
  categoryIds: string[]
  /** Legacy listings.category text equality (optional). */
  legacyCategory?: string | null
  countryIds?: string[]
  tier?: string | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyQuery = any

/** Apply the same non-FTS filters the public listings GET endpoint uses. */
export function applyActiveListingFilters(
  query: AnyQuery,
  filters: ListingFilterIds,
): AnyQuery {
  let q = query.eq('status', 'active')

  if (filters.legacyCategory) q = q.eq('category', filters.legacyCategory)
  if (filters.industryIds.length) q = q.in('industry_id', filters.industryIds)
  if (filters.categoryIds.length) q = q.in('category_id', filters.categoryIds)
  if (filters.countryIds?.length) q = q.in('country_id', filters.countryIds)
  if (filters.tier) q = q.eq('tier', filters.tier)

  return q
}

/**
 * Count active listings matching taxonomy filters — same filter path as the
 * search grid (status=active + industry_id / category_id).
 */
export async function countActiveListingsForFilters(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: { from: (table: string) => any },
  filters: ListingFilterIds,
): Promise<number> {
  let query = client
    .from('listings')
    .select('id', { count: 'exact', head: true })

  query = applyActiveListingFilters(query, filters)

  const { count, error } = await query
  if (error) throw new Error(error.message)
  return count ?? 0
}
