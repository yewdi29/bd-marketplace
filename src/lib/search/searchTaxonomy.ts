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

  type CatRow = {
    id: string
    name: string
    slug: string
    category_industries:
      | { industry_id: string; industries: { slug: string } | null }[]
      | null
  }

  return {
    industries: (industries ?? []) as TaxonomyIndustry[],
    categories: ((categories ?? []) as CatRow[]).map(row => {
      const links = row.category_industries ?? []
      return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        industryIds: links.map(l => l.industry_id).filter(Boolean),
        industrySlugs: links
          .map(l => l.industries?.slug)
          .filter((s): s is string => Boolean(s)),
      }
    }),
  }
}

export function parseSlugList(raw: string | null | undefined): string[] {
  if (!raw) return []
  return raw.split(',').map(s => s.trim()).filter(Boolean)
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
  const category = categorySlug ? categoryBySlug.get(categorySlug) ?? null : null

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
  /** True when both are set and the category belongs to the industry. */
  combined: boolean
}

/**
 * Decide which taxonomy labels to use for SEO copy.
 * Unlinked industry+category pairs fall back to category-only (more specific).
 */
export function resolveSearchSeoFilters(
  taxonomy: SearchTaxonomy,
  params: {
    industry?: string | null
    cat?: string | null
    category?: string | null
  },
): ResolvedSearchFilters {
  const { industry, category, linked } = resolveWhitelistedSearchTaxonomy(taxonomy, params)

  if (industry && category && linked) {
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
