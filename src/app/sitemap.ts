import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'
import { PUBLIC_SITE_URL } from '@/lib/site'
import { loadSearchTaxonomy } from '@/lib/search/searchTaxonomy'

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
      url: PUBLIC_SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${PUBLIC_SITE_URL}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${PUBLIC_SITE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${PUBLIC_SITE_URL}/careers`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${PUBLIC_SITE_URL}/journal`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${PUBLIC_SITE_URL}/sellers`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ]

  const [{ data: articles }, { data: listings }, { data: sellers }, { data: orgs }, taxonomy] = await Promise.all([
    supabase
      .from('articles')
      .select('slug, updated_at, published_at')
      .eq('status', 'published'),
    supabase
      .from('listings')
      .select('slug, updated_at')
      .eq('status', 'active')
      .not('slug', 'is', null),
    supabase
      .from('users')
      .select('id, company_slug, updated_at')
      .not('company_slug', 'is', null),
    supabase
      .from('organizations')
      .select('slug, updated_at')
      .not('slug', 'is', null),
    loadSearchTaxonomy(supabase),
  ])

  const { data: orgMembers } = await supabase
    .from('org_members')
    .select('user_id')
    .eq('status', 'active')
    .not('user_id', 'is', null)

  const orgMemberIds = new Set(
    (orgMembers ?? []).map(m => m.user_id as string).filter(Boolean),
  )

  const articlePages: MetadataRoute.Sitemap = (articles ?? []).map(article => ({
    url: `${PUBLIC_SITE_URL}/journal/${article.slug}`,
    lastModified: new Date(article.updated_at ?? article.published_at ?? new Date()),
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  const listingPages: MetadataRoute.Sitemap = (listings ?? []).map(listing => ({
    url: `${PUBLIC_SITE_URL}/listings/${listing.slug}`,
    lastModified: new Date(listing.updated_at ?? new Date()),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const sellerPages: MetadataRoute.Sitemap = [
    ...(orgs ?? [])
      .filter(org => org.slug)
      .map(org => ({
        url: `${PUBLIC_SITE_URL}/sellers/${org.slug}`,
        lastModified: new Date(org.updated_at ?? new Date()),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      })),
    ...(sellers ?? [])
      .filter(seller => seller.company_slug && !orgMemberIds.has(seller.id))
      .map(seller => ({
        url: `${PUBLIC_SITE_URL}/sellers/${seller.company_slug}`,
        lastModified: new Date(seller.updated_at ?? new Date()),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      })),
  ]

  // Industry / category filter URLs — whitelist from taxonomy only
  const taxonomySearchPages: MetadataRoute.Sitemap = []
  const now = new Date()

  for (const industry of taxonomy.industries) {
    taxonomySearchPages.push({
      url: `${PUBLIC_SITE_URL}/search?industry=${encodeURIComponent(industry.slug)}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.85,
    })
  }

  for (const category of taxonomy.categories) {
    taxonomySearchPages.push({
      url: `${PUBLIC_SITE_URL}/search?cat=${encodeURIComponent(category.slug)}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.85,
    })

    for (const industrySlug of category.industrySlugs) {
      taxonomySearchPages.push({
        url: `${PUBLIC_SITE_URL}/search?industry=${encodeURIComponent(industrySlug)}&cat=${encodeURIComponent(category.slug)}`,
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
