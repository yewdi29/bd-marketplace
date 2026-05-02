import { createClient } from '@/lib/supabase/server'
import ListingCard from '@/components/ListingCard'
import TierBadge from '@/components/TierBadge'
import type { Listing, ListingTier } from '@/lib/types/database'

const CATEGORIES = [
  { label: 'All', value: '' },
  { label: 'Drill Pipe', value: 'drill_pipe' },
  { label: 'Rigs', value: 'rig' },
  { label: 'BOP', value: 'blowout_preventer' },
  { label: 'Pumping Units', value: 'pumping_unit' },
  { label: 'Wellheads', value: 'wellhead' },
  { label: 'Compressors', value: 'compressor' },
  { label: 'Mud Pumps', value: 'mud_pump' },
  { label: 'Tanks', value: 'tank' },
]

const TIERS: { label: string; value: ListingTier | '' }[] = [
  { label: 'All Tiers', value: '' },
  { label: 'Green (< $100K)', value: 'green' },
  { label: 'Yellow ($100K–$500K)', value: 'yellow' },
  { label: 'Red (> $500K)', value: 'red' },
]

const SORT_OPTIONS = [
  { label: 'Newest First', value: 'created_at:desc' },
  { label: 'Oldest First', value: 'created_at:asc' },
  { label: 'Price: Low → High', value: 'price:asc' },
  { label: 'Price: High → Low', value: 'price:desc' },
]

interface SearchParams {
  category?: string
  tier?: string
  sort?: string
  featured?: string
  q?: string
}

export const metadata = {
  title: 'Browse Equipment',
  description: 'Search thousands of oil & gas equipment listings. Drill pipe, rigs, BOP stacks, and more.',
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('listings')
    .select('*, listing_images(*)')
    .eq('status', 'active')

  if (params.category) query = query.eq('category', params.category)
  if (params.tier) query = query.eq('tier', params.tier as ListingTier)
  if (params.featured === 'true') query = query.eq('featured', true)
  if (params.q) query = query.ilike('title', `%${params.q}%`)

  const [sortField, sortDir] = (params.sort ?? 'created_at:desc').split(':')
  query = query.order(sortField as keyof Listing, { ascending: sortDir === 'asc' })

  const { data: listings } = await query.limit(48)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-5xl tracking-widest text-white">EQUIPMENT LISTINGS</h1>
        <p className="mt-2 font-body text-sm text-gray-500">
          {listings?.length ?? 0} active listings
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar filters */}
        <aside className="w-full lg:w-56 flex-shrink-0">
          <form method="GET" className="space-y-6">
            {/* Search */}
            <div>
              <label className="block font-display text-sm tracking-widest text-gray-400 mb-2">SEARCH</label>
              <input
                name="q"
                defaultValue={params.q}
                placeholder="Drill pipe, BOP..."
                className="w-full bg-surface border border-surface-border text-white placeholder-gray-600 px-3 py-2 text-sm font-body focus:outline-none focus:border-gold"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block font-display text-sm tracking-widest text-gray-400 mb-2">CATEGORY</label>
              <div className="space-y-1">
                {CATEGORIES.map(cat => (
                  <a
                    key={cat.value}
                    href={`/listings?${new URLSearchParams({ ...params, category: cat.value }).toString()}`}
                    className={`block px-2 py-1.5 text-sm font-body transition-colors ${
                      (params.category ?? '') === cat.value
                        ? 'text-gold bg-gold/10'
                        : 'text-gray-400 hover:text-gold hover:bg-surface'
                    }`}
                  >
                    {cat.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Tier */}
            <div>
              <label className="block font-display text-sm tracking-widest text-gray-400 mb-2">TIER</label>
              <div className="space-y-2">
                {TIERS.map(t => (
                  <a
                    key={t.value}
                    href={`/listings?${new URLSearchParams({ ...params, tier: t.value }).toString()}`}
                    className={`flex items-center gap-2 text-sm font-body transition-colors ${
                      (params.tier ?? '') === t.value ? 'text-gold' : 'text-gray-400 hover:text-gold'
                    }`}
                  >
                    {t.value ? <TierBadge tier={t.value} size="sm" /> : null}
                    {!t.value && <span>{t.label}</span>}
                  </a>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div>
              <label className="block font-display text-sm tracking-widest text-gray-400 mb-2">SORT BY</label>
              <select
                name="sort"
                defaultValue={params.sort ?? 'created_at:desc'}
                className="w-full bg-surface border border-surface-border text-white px-3 py-2 text-sm font-body focus:outline-none focus:border-gold"
                onChange={e => {
                  const url = new URL(window.location.href)
                  url.searchParams.set('sort', e.target.value)
                  window.location.href = url.toString()
                }}
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Clear filters */}
            {(params.category || params.tier || params.q) && (
              <a href="/listings" className="block text-xs font-body text-gray-600 hover:text-gold transition-colors">
                ✕ Clear all filters
              </a>
            )}
          </form>
        </aside>

        {/* Listings grid */}
        <div className="flex-1">
          {listings && listings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {(listings as Listing[]).map(listing => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="font-display text-2xl tracking-widest text-gray-400">NO LISTINGS FOUND</h3>
              <p className="mt-2 font-body text-sm text-gray-600">
                Try adjusting your filters or{' '}
                <a href="/listings" className="text-gold hover:underline">view all listings</a>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
