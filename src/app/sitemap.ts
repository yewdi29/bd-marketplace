import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import type { MetadataRoute } from 'next'

const BASE_URL = 'https://blackdiamondmkt.com'

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
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/knowledge-base`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/sellers`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ]

  const [{ data: articles }, { data: listings }, { data: sellers }] = await Promise.all([
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
      .select('company_slug, updated_at')
      .not('company_slug', 'is', null),
  ])

  const articlePages: MetadataRoute.Sitemap = (articles ?? []).map(article => ({
    url: `${BASE_URL}/knowledge-base/${article.slug}`,
    lastModified: new Date(article.updated_at ?? article.published_at ?? new Date()),
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  const listingPages: MetadataRoute.Sitemap = (listings ?? []).map(listing => ({
    url: `${BASE_URL}/listings/${listing.slug}`,
    lastModified: new Date(listing.updated_at ?? new Date()),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const sellerPages: MetadataRoute.Sitemap = (sellers ?? []).map(seller => ({
    url: `${BASE_URL}/sellers/${seller.company_slug}`,
    lastModified: new Date(seller.updated_at ?? new Date()),
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  return [...staticPages, ...articlePages, ...listingPages, ...sellerPages]
}
