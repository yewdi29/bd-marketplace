import type { Metadata } from 'next'
import SearchPageClient from './SearchPageClient'
import { buildSearchQueryKey } from '@/lib/listings/publicSearchQueryKey'
import { buildSearchMetadata, resolveSearchSeoState } from '@/lib/search/searchMetadata'
import { createClient } from '@/lib/supabase/server'
import { queryPublicListings } from '@/lib/listings/queryPublicListings'
import type { ListingCardListing } from '@/components/listings/listingCardTypes'

/** Always render from the live query string so industry+cat is never cached as industry-only. */
export const dynamic = 'force-dynamic'

type SearchQuery = Record<string, string | string[] | undefined>

type SearchPageProps = {
  searchParams: Promise<SearchQuery> | SearchQuery
}

async function readSearchParams(searchParams: SearchPageProps['searchParams']): Promise<SearchQuery> {
  return await Promise.resolve(searchParams)
}

function firstParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const params = await readSearchParams(searchParams)
  return buildSearchMetadata({
    industry: params.industry,
    cat: params.cat,
    category: params.category,
  })
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await readSearchParams(searchParams)
  const seo = await resolveSearchSeoState({
    industry: params.industry,
    cat: params.cat,
    category: params.category,
  })

  const getter = { get: (name: string) => firstParam(params[name]) }
  const initialQueryKey = buildSearchQueryKey(getter)

  let initialListings: ListingCardListing[] = []
  let initialTotal = 0
  let queryKeyForClient = initialQueryKey

  // cookies() must not be inside try/catch — Next.js uses a throw to opt into
  // dynamic rendering, and catching it aborts SSR (digest 399039579).
  const supabase = await createClient()
  try {
    const result = await queryPublicListings(supabase, {
      category: firstParam(params.category),
      industry: firstParam(params.industry),
      cat: firstParam(params.cat),
      country: firstParam(params.country),
      tier: firstParam(params.tier),
      q: firstParam(params.q),
      sort: firstParam(params.sort),
      lat: firstParam(params.lat),
      lng: firstParam(params.lng),
      limit: 48,
      offset: 0,
    })
    initialListings = result.listings
    initialTotal = result.total
  } catch (error) {
    console.error(error)
    // SSR failure must not break the page — client will fetch.
    queryKeyForClient = ''
  }

  return (
    <SearchPageClient
      initialListings={initialListings}
      initialTotal={initialTotal}
      initialQueryKey={queryKeyForClient}
    >
      <header className="mb-5">
        <h1
          className="font-sans font-bold text-ink"
          style={{ fontSize: 'clamp(28px, 4vw, 36px)', letterSpacing: '-0.03em', lineHeight: 1.1 }}
        >
          {seo.title}
        </h1>
        <p className="mt-2 font-sans text-ink-3 text-sm leading-relaxed max-w-2xl">
          {seo.description}
        </p>
      </header>
    </SearchPageClient>
  )
}
