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

export const GENERIC_SEARCH_TITLE = 'Heavy Equipment for Sale'
export const GENERIC_SEARCH_DESCRIPTION =
  'Browse verified heavy equipment for sale across oil and gas, construction, mining, agriculture, forestry, and trucks and trailers.'

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
  const subject = filters.industry && filters.category
    ? `${filters.industry.name} ${filters.category.name}`
    : filters.category
      ? filters.category.name
      : filters.industry
        ? `${filters.industry.name} equipment`
        : 'heavy equipment'

  if (count === 0) {
    return `No ${subject} listings are live right now. Browse all equipment on Black Diamond Marketplace or check back soon.`
  }
  if (count === 1) {
    return `1 ${subject} listing from a verified seller on Black Diamond Marketplace.`
  }
  return `${count} ${subject} listings from verified sellers on Black Diamond Marketplace.`
}

export function searchFiltersToListingIds(filters: ResolvedSearchFilters): ListingFilterIds {
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

export type SearchSeoState = {
  title: string
  description: string
  canonical: string
  count: number
  emptyFiltered: boolean
}

export async function resolveSearchSeoState(params: {
  industry?: string | string[] | undefined
  cat?: string | string[] | undefined
  category?: string | string[] | undefined
}): Promise<SearchSeoState> {
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
      canonical: `${PUBLIC_SITE_URL}/search`,
      count: -1,
      emptyFiltered: false,
    }
  }

  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  let count = 0
  try {
    count = await countActiveListingsForFilters(client, searchFiltersToListingIds(filters))
  } catch {
    count = 0
  }

  return {
    title: buildSearchSeoTitle(filters),
    description: buildSearchSeoDescription(filters, count),
    canonical,
    count,
    emptyFiltered: count === 0,
  }
}

export async function buildSearchMetadata(params: {
  industry?: string | string[] | undefined
  cat?: string | string[] | undefined
  category?: string | string[] | undefined
}): Promise<Metadata> {
  const seo = await resolveSearchSeoState(params)

  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: seo.canonical },
    robots: seo.emptyFiltered
      ? { index: false, follow: true }
      : { index: true, follow: true },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: seo.canonical,
    },
  }
}
