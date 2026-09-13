import { createClient } from '@supabase/supabase-js'

export type TaxonomyIndustry = {
  id: string
  name: string
  slug: string
}

export type TaxonomyCategory = {
  id: string
  name: string
  slug: string
  industryIds: string[]
  industrySlugs: string[]
}

export type SearchTaxonomy = {
  industries: TaxonomyIndustry[]
  categories: TaxonomyCategory[]
}

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

/** Load the same industry/category taxonomy that powers search filter dropdowns. */
export async function loadSearchTaxonomy(
  client?: { from: (table: string) => unknown },
): Promise<SearchTaxonomy> {
  const db = client ?? getAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = db as any

  const [{ data: industries }, { data: categories }] = await Promise.all([
    supabase.from('industries').select('id, name, slug').order('sort_order'),
    supabase
      .from('categories')
      .select('id, name, slug, category_industries(industry_id, industries(slug))')
      .order('name'),
  ])

  type IndustryRef = { slug: string } | { slug: string }[] | null
  type CatRow = {
    id: string
    name: string
    slug: string
    category_industries:
      | { industry_id?: string; industries?: IndustryRef }[]
      | null
  }

  let categoryRows = (categories ?? []) as CatRow[]
  if (categoryRows.length === 0) {
    const { data: fallbackCats } = await supabase
      .from('categories')
      .select('id, name, slug')
      .order('name')
    categoryRows = (fallbackCats ?? []) as CatRow[]
  }

  return {
    industries: (industries ?? []) as TaxonomyIndustry[],
    categories: categoryRows.map(row => {
      const links = row.category_industries ?? []
      return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        industryIds: links.map(l => l.industry_id).filter((id): id is string => Boolean(id)),
        industrySlugs: links
          .flatMap(l => {
            const raw = l.industries
            if (!raw) return []
            return Array.isArray(raw) ? raw : [raw]
          })
          .map(i => i.slug)
          .filter(Boolean),
      }
    }),
  }
}

export function parseSlugList(raw: string | null | undefined): string[] {
  if (!raw) return []
  return raw.split(',').map(s => s.trim()).filter(Boolean)
}

/**
 * Category slugs in the taxonomy are hyphenated (`coiled-tubing-equipment`).
 * Industry slugs use underscores (`oil_gas`) and must not be rewritten.
 * Accept `_` / `-` aliases for category lookup only.
 */
export function categorySlugLookupVariants(slug: string): string[] {
  const trimmed = slug.trim()
  if (!trimmed) return []
  const variants = [trimmed, trimmed.replace(/_/g, '-'), trimmed.replace(/-/g, '_')]
  return variants.filter((value, index) => variants.indexOf(value) === index)
}

function lookupCategoryBySlug(
  categoryBySlug: Map<string, TaxonomyCategory>,
  slug: string | null,
): TaxonomyCategory | null {
  if (!slug) return null
  for (const variant of categorySlugLookupVariants(slug)) {
    const match = categoryBySlug.get(variant)
    if (match) return match
  }
  return null
}

/**
 * Resolve industry/category query params against the taxonomy whitelist only.
 * Accepts `cat` (FilterBar) and `category` as an alias — but only when the value
 * is a known taxonomy category slug (never a raw/untrusted string).
 */
export function resolveWhitelistedSearchTaxonomy(
  taxonomy: SearchTaxonomy,
  params: {
    industry?: string | null
    cat?: string | null
    category?: string | null
  },
): {
  industry: TaxonomyIndustry | null
  category: TaxonomyCategory | null
  linked: boolean
} {
  const industryBySlug = new Map(
    taxonomy.industries.map(i => [i.slug, i]),
  )
  const categoryBySlug = new Map(
    taxonomy.categories.map(c => [c.slug, c]),
  )

  const industrySlug = parseSlugList(params.industry)[0] ?? null
  // Prefer `cat` (canonical filter param); allow `category` only as alias for a taxonomy slug
  const categorySlug =
    parseSlugList(params.cat)[0]
    ?? parseSlugList(params.category)[0]
    ?? null

  const industry = industrySlug ? industryBySlug.get(industrySlug) ?? null : null
  const category = lookupCategoryBySlug(categoryBySlug, categorySlug)

  const linked = Boolean(
    industry
    && category
    && category.industrySlugs.includes(industry.slug),
  )

  return { industry, category, linked }
}

export type ResolvedSearchFilters = {
  industry: TaxonomyIndustry | null
  category: TaxonomyCategory | null
  /** True when both a valid industry slug and a valid category slug are present. */
  combined: boolean
}

/**
 * Decide which taxonomy labels to use for SEO copy and canonical URLs.
 * Any valid industry + category pair is a distinct listing set (same AND
 * filter as /api/listings) — do not strip `cat` or fall back to the industry
 * parent, even if category_industries has not linked the pair.
 */
export function resolveSearchSeoFilters(
  taxonomy: SearchTaxonomy,
  params: {
    industry?: string | null
    cat?: string | null
    category?: string | null
  },
): ResolvedSearchFilters {
  const { industry, category } = resolveWhitelistedSearchTaxonomy(taxonomy, params)

  if (industry && category) {
    return { industry, category, combined: true }
  }
  if (category) {
    return { industry: null, category, combined: false }
  }
  if (industry) {
    return { industry, category: null, combined: false }
  }
  return { industry: null, category: null, combined: false }
}

/** Build a canonical /search URL with only normalized industry/cat params. */
export function buildSearchCanonicalPath(filters: ResolvedSearchFilters): string {
  const params = new URLSearchParams()
  if (filters.combined && filters.industry && filters.category) {
    params.set('industry', filters.industry.slug)
    params.set('cat', filters.category.slug)
  } else if (filters.category) {
    params.set('cat', filters.category.slug)
  } else if (filters.industry) {
    params.set('industry', filters.industry.slug)
  }
  const qs = params.toString()
  return qs ? `/search?${qs}` : '/search'
}
