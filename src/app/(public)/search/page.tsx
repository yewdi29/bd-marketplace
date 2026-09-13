import type { Metadata } from 'next'
import SearchPageClient from './SearchPageClient'
import { buildSearchMetadata, resolveSearchSeoState } from '@/lib/search/searchMetadata'

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
  const params = await readSearchParams(searchParams)
  const seo = await resolveSearchSeoState({
    industry: params.industry,
    cat: params.cat,
    category: params.category,
  })

  return (
    <SearchPageClient>
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
