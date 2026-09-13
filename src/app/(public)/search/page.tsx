import type { Metadata } from 'next'
import SearchPageClient from './SearchPageClient'
import { buildSearchMetadata } from '@/lib/search/searchMetadata'

/** Always render from the live query string so industry+cat is never cached as industry-only. */
export const dynamic = 'force-dynamic'

type SearchQuery = Record<string, string | string[] | undefined>

type SearchPageProps = {
  searchParams: Promise<SearchQuery> | SearchQuery
}

async function readSearchParams(searchParams: SearchPageProps['searchParams']): Promise<SearchQuery> {
  return await Promise.resolve(searchParams)
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
  // Read searchParams in the page as well so the route cannot be statically
  // optimized without the industry/cat query that generateMetadata depends on.
  await readSearchParams(searchParams)
  return <SearchPageClient />
}
