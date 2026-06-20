import {
  type LocationLookupClient,
  loadLocationTaxonomy,
  resolveLocationFromIds,
  resolveLocationIds,
} from '@/lib/locationResolver'
import { resolveCategoryAndIndustryIds, resolveCategoryBySlugs } from '@/lib/categoryResolver'

interface CategoryLookupClient {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (table: string) => any
}

export async function applyTaxonomyFieldsToUpdates(
  client: LocationLookupClient & CategoryLookupClient,
  fields: Record<string, unknown>,
  updates: Record<string, unknown>,
): Promise<void> {
  const emptyToNull = (value: unknown) => (value === '' || value === undefined ? null : value)

  const hasLocationFields =
    'country_id' in fields ||
    'region_id' in fields ||
    'state_id' in fields ||
    'location_city' in fields

  if (hasLocationFields) {
    const taxonomy = await loadLocationTaxonomy(client)
    const resolved = resolveLocationFromIds(taxonomy, {
      country_id: emptyToNull(fields.country_id) as string | null,
      region_id: emptyToNull(fields.region_id) as string | null,
      state_id: emptyToNull(fields.state_id) as string | null,
      location_city: fields.location_city as string | null | undefined,
    })
    updates.country_id = resolved.country_id
    updates.region_id = resolved.region_id
    updates.state_id = resolved.state_id
    updates.location_city = resolved.location_city
    updates.location_state = resolved.location_state
  }

  if ('industry_id' in fields) {
    updates.industry_id = emptyToNull(fields.industry_id)
  }

  if ('category_id' in fields && fields.category_id) {
    updates.category_id = fields.category_id
    const { data: cat } = await client
      .from('categories')
      .select('slug')
      .eq('id', fields.category_id as string)
      .maybeSingle()
    if (cat?.slug) {
      updates.category = (cat.slug as string).replace(/-/g, '_')
    }
  } else if ('category_id' in fields) {
    updates.category_id = null
  }
}

export async function resolveAiTaxonomy(
  client: LocationLookupClient & CategoryLookupClient,
  generated: {
    country_slug?: string | null
    location_city?: string | null
    location_state?: string | null
    industry_slug?: string | null
    category_slug?: string | null
    title?: string | null
    category?: string | null
  },
): Promise<{
  country_id: string | null
  region_id: string | null
  state_id: string | null
  location_city: string | null
  location_state: string | null
  industry_id: string | null
  category_id: string | null
  legacyCategory: string
}> {
  const location = await resolveLocationIds(client, {
    country_slug: generated.country_slug,
    location_city: generated.location_city,
    location_state: generated.location_state,
  })

  let industry_id: string | null = null
  let category_id: string | null = null
  let legacyCategory = generated.category || 'other'

  if (generated.industry_slug || generated.category_slug) {
    const bySlug = await resolveCategoryBySlugs(
      client,
      generated.industry_slug,
      generated.category_slug,
    )
    industry_id = bySlug.industry_id
    category_id = bySlug.category_id
    if (bySlug.legacyCategory) legacyCategory = bySlug.legacyCategory
  }

  if (!category_id) {
    const fallback = await resolveCategoryAndIndustryIds(
      client,
      generated.title,
      generated.category,
    )
    industry_id = fallback.industry_id
    category_id = fallback.category_id
  }

  return {
    ...location,
    industry_id,
    category_id,
    legacyCategory,
  }
}
