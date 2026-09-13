import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import { PUBLIC_SITE_URL } from '@/lib/site'
import {
  countActiveListingsForFilters,
  type ListingFilterIds,
} from '@/lib/search/listingFilters'
import {
  buildSearchCanonicalPath,
  loadSearchTaxonomy,
  resolveSearchSeoFilters,
  type ResolvedSearchFilters,
} from '@/lib/search/searchTaxonomy'

export const GENERIC_SEARCH_TITLE = 'Browse Heavy Equipment'
export const GENERIC_SEARCH_DESCRIPTION =
  'Search thousands of verified heavy equipment listings across oil and gas, construction, mining, agriculture, forestry, and trucks and trailers.'

export function buildSearchSeoTitle(filters: ResolvedSearchFilters): string {
  if (filters.category && filters.industry) {
    return `${filters.industry.name} ${filters.category.name} for Sale`
  }
  if (filters.category) {
    return `${filters.category.name} for Sale`
  }
  if (filters.industry) {
    return `${filters.industry.name} Equipment for Sale`
  }
  return GENERIC_SEARCH_TITLE
}

export function buildSearchSeoDescription(
  filters: ResolvedSearchFilters,
  count: number,
): string {
  if (filters.industry && filters.category) {
    return `We have ${count} ${filters.industry.name} ${filters.category.name} for sale — verified sellers, with new listings added daily.`
  }
  if (filters.category) {
    return `We have ${count} ${filters.category.name} for sale — verified sellers across industrial sectors, with new listings added daily.`
  }
  if (filters.industry) {
    return `We have ${count} ${filters.industry.name} Equipment for sale — verified sellers in ${filters.industry.name}, with new listings added daily.`
  }
  return GENERIC_SEARCH_DESCRIPTION
}

function filtersToListingIds(filters: ResolvedSearchFilters): ListingFilterIds {
  if (filters.combined && filters.industry && filters.category) {
    return {
      industryIds: [filters.industry.id],
      categoryIds: [filters.category.id],
    }
  }
  if (filters.category) {
    return { industryIds: [], categoryIds: [filters.category.id] }
  }
  if (filters.industry) {
    return { industryIds: [filters.industry.id], categoryIds: [] }
  }
  return { industryIds: [], categoryIds: [] }
}

export async function buildSearchMetadata(params: {
  industry?: string | string[] | undefined
  cat?: string | string[] | undefined
  category?: string | string[] | undefined
}): Promise<Metadata> {
  const first = (v: string | string[] | undefined): string | null => {
    if (Array.isArray(v)) return v[0] ?? null
    return v ?? null
  }

  const taxonomy = await loadSearchTaxonomy()
  const filters = resolveSearchSeoFilters(taxonomy, {
    industry: first(params.industry),
    cat: first(params.cat),
    category: first(params.category),
  })

  const canonicalPath = buildSearchCanonicalPath(filters)
  const canonical = `${PUBLIC_SITE_URL}${canonicalPath}`

  if (!filters.industry && !filters.category) {
    return {
      title: GENERIC_SEARCH_TITLE,
      description: GENERIC_SEARCH_DESCRIPTION,
      alternates: { canonical: `${PUBLIC_SITE_URL}/search` },
    }
  }

  // Same active-listing filter path as /api/listings (status=active + taxonomy ids).
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  let count = 0
  try {
    count = await countActiveListingsForFilters(client, filtersToListingIds(filters))
  } catch {
    count = 0
  }

  const title = buildSearchSeoTitle(filters)
  const description = buildSearchSeoDescription(filters, count)
  const emptyFiltered = count === 0

  return {
    title,
    description,
    alternates: { canonical },
    robots: emptyFiltered
      ? { index: false, follow: true }
      : { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: canonical,
    },
  }
}
