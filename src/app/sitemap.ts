import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'
import { loadSearchTaxonomy } from '@/lib/search/searchTaxonomy'
import { PUBLIC_SITE_URL } from '@/lib/site'

/**
 * Next.js 14 MetadataRoute.Sitemap does not XML-escape `&` in <loc> (vercel/next.js#77340).
 * Escape before returning so query-string URLs produce valid sitemap XML.
 */
function sitemapLoc(url: string): string {
  return url.replace(/&/g, '&amp;')
}

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = getAdminClient()

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: sitemapLoc(PUBLIC_SITE_URL),
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: sitemapLoc(`${PUBLIC_SITE_URL}/search`),
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: sitemapLoc(`${PUBLIC_SITE_URL}/about`),
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: sitemapLoc(`${PUBLIC_SITE_URL}/how-it-works`),
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: sitemapLoc(`${PUBLIC_SITE_URL}/pricing`),
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: sitemapLoc(`${PUBLIC_SITE_URL}/contact`),
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: sitemapLoc(`${PUBLIC_SITE_URL}/careers`),
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: sitemapLoc(`${PUBLIC_SITE_URL}/journal`),
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: sitemapLoc(`${PUBLIC_SITE_URL}/sellers`),
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ]

  const [
    { data: articles },
    { data: listings },
    { data: sellers },
    { data: orgs },
    taxonomy,
  ] = await Promise.all([
    supabase
      .from('articles')
      .select('slug, updated_at, published_at')
      .eq('status', 'published'),
    supabase
      .from('listings')
      .select('slug, updated_at, industry_id, category_id, seller_id, organization_id')
      .eq('status', 'active')
      .not('slug', 'is', null),
    supabase
      .from('users')
      .select('id, company_slug, updated_at')
      .not('company_slug', 'is', null),
    supabase
      .from('organizations')
      .select('id, slug, updated_at')
      .not('slug', 'is', null),
    loadSearchTaxonomy(supabase),
  ])

  const { data: orgMembers } = await supabase
    .from('org_members')
    .select('user_id, organization_id')
    .eq('status', 'active')
    .not('user_id', 'is', null)

  const orgMemberIds = new Set(
    (orgMembers ?? []).map(m => m.user_id as string).filter(Boolean),
  )

  const orgIdsWithActiveListings = new Set<string>()
  const soloSellerIdsWithActiveListings = new Set<string>()
  for (const row of listings ?? []) {
    const organizationId = row.organization_id as string | null
    const sellerId = row.seller_id as string | null
    if (organizationId) orgIdsWithActiveListings.add(organizationId)
    else if (sellerId) soloSellerIdsWithActiveListings.add(sellerId)
  }

  const orgIdsFromMemberSoloListings = new Set<string>()
  for (const member of orgMembers ?? []) {
    const userId = member.user_id as string | null
    const organizationId = member.organization_id as string | null
    if (userId && organizationId && soloSellerIdsWithActiveListings.has(userId)) {
      orgIdsFromMemberSoloListings.add(organizationId)
    }
  }

  const industryIdsWithStock = new Set<string>()
  const categoryIdsWithStock = new Set<string>()
  const pairKeys = new Set<string>()

  for (const row of listings ?? []) {
    const industryId = row.industry_id as string | null
    const categoryId = row.category_id as string | null
    if (industryId) industryIdsWithStock.add(industryId)
    if (categoryId) categoryIdsWithStock.add(categoryId)
    if (industryId && categoryId) pairKeys.add(`${industryId}::${categoryId}`)
  }

  const articlePages: MetadataRoute.Sitemap = (articles ?? []).map(article => ({
    url: sitemapLoc(`${PUBLIC_SITE_URL}/journal/${article.slug}`),
    lastModified: new Date(article.updated_at ?? article.published_at ?? new Date()),
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  const listingPages: MetadataRoute.Sitemap = (listings ?? []).map(listing => ({
    url: sitemapLoc(`${PUBLIC_SITE_URL}/listings/${listing.slug}`),
    lastModified: new Date(listing.updated_at ?? new Date()),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const sellerPages: MetadataRoute.Sitemap = [
    ...(orgs ?? [])
      .filter(
        org =>
          Boolean(org.slug) &&
          (orgIdsWithActiveListings.has(org.id) || orgIdsFromMemberSoloListings.has(org.id)),
      )
      .map(org => ({
        url: sitemapLoc(`${PUBLIC_SITE_URL}/sellers/${org.slug}`),
        lastModified: new Date(org.updated_at ?? new Date()),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      })),
    ...(sellers ?? [])
      .filter(
        seller =>
          Boolean(seller.company_slug) &&
          !orgMemberIds.has(seller.id) &&
          soloSellerIdsWithActiveListings.has(seller.id),
      )
      .map(seller => ({
        url: sitemapLoc(`${PUBLIC_SITE_URL}/sellers/${seller.company_slug}`),
        lastModified: new Date(seller.updated_at ?? new Date()),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      })),
  ]

  // Only include industry/category URLs that have at least one active listing.
  // Empty filter pages are noindex and must not be submitted in the sitemap.
  const taxonomySearchPages: MetadataRoute.Sitemap = []
  const now = new Date()

  for (const industry of taxonomy.industries) {
    if (!industryIdsWithStock.has(industry.id)) continue
    taxonomySearchPages.push({
      url: sitemapLoc(
        `${PUBLIC_SITE_URL}/search?industry=${encodeURIComponent(industry.slug)}`,
      ),
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.85,
    })
  }

  for (const category of taxonomy.categories) {
    if (!categoryIdsWithStock.has(category.id)) continue

    taxonomySearchPages.push({
      url: sitemapLoc(
        `${PUBLIC_SITE_URL}/search?cat=${encodeURIComponent(category.slug)}`,
      ),
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.85,
    })

    for (const industrySlug of category.industrySlugs) {
      const industry = taxonomy.industries.find(i => i.slug === industrySlug)
      if (!industry || !pairKeys.has(`${industry.id}::${category.id}`)) continue
      taxonomySearchPages.push({
        url: sitemapLoc(
          `${PUBLIC_SITE_URL}/search?industry=${encodeURIComponent(industrySlug)}&cat=${encodeURIComponent(category.slug)}`,
        ),
        lastModified: now,
        changeFrequency: 'daily',
        priority: 0.8,
      })
    }
  }

  return [
    ...staticPages,
    ...taxonomySearchPages,
    ...articlePages,
    ...listingPages,
    ...sellerPages,
  ]
}
