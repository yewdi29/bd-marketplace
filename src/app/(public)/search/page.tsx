import type { Metadata } from 'next'
import SearchPageClient from './SearchPageClient'
import { buildSearchMetadata } from '@/lib/search/searchMetadata'

type SearchPageProps = {
  searchParams: Record<string, string | string[] | undefined>
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  return buildSearchMetadata({
    industry: searchParams.industry,
    cat: searchParams.cat,
    category: searchParams.category,
  })
}

export default function SearchPage() {
  return <SearchPageClient />
}
