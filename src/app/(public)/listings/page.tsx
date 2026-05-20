import { createClient } from '@/lib/supabase/server'
import ListingCard from '@/components/ListingCard'
import type { Listing } from '@/lib/types/database'

const CATEGORIES = [
  { label: 'Drill Pipe', value: 'drill_pipe' },
  { label: 'Drilling Rigs', value: 'rig' },
  { label: 'Blowout Preventers', value: 'blowout_preventer' },
  { label: 'Pumping Units', value: 'pumping_unit' },
  { label: 'Wellheads', value: 'wellhead' },
  { label: 'Compressors', value: 'compressor' },
  { label: 'Mud Pumps', value: 'mud_pump' },
  { label: 'Tanks & Vessels', value: 'tank' },
]

const CONDITIONS = [
  { label: 'New', value: 'new' },
  { label: 'Like New', value: 'like_new' },
  { label: 'Good', value: 'good' },
  { label: 'Fair', value: 'fair' },
  { label: 'Parts Only', value: 'parts_only' },
]

const SORT_OPTIONS = [
  { label: 'Newest First', value: 'created_at:desc' },
  { label: 'Oldest First', value: 'created_at:asc' },
  { label: 'Price: Low → High', value: 'price:asc' },
  { label: 'Price: High → Low', value: 'price:desc' },
]

interface SearchParams {
  category?: string
  condition?: string
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

  const { data: { user } } = await supabase.auth.getUser()
  let savedIds = new Set<string>()
  if (user) {
    const { data: saved } = await supabase
      .from('saved_listings')
      .select('listing_id')
      .eq('user_id', user.id)
    savedIds = new Set((saved ?? []).map((s: { listing_id: string }) => s.listing_id))
  }

  let query = supabase
    .from('listings')
    .select('*, listing_images(*)')
    .eq('status', 'active')

  if (params.category) query = query.eq('category', params.category)
  if (params.condition) query = query.eq('condition', params.condition)
  if (params.featured === 'true') query = query.eq('featured', true)
  if (params.q) query = query.ilike('title', `%${params.q}%`)

  const [sortField, sortDir] = (params.sort ?? 'created_at:desc').split(':')
  query = query.order(sortField as keyof Listing, { ascending: sortDir === 'asc' })

  const { data: listings } = await query.limit(48)
  const count = listings?.length ?? 0

  const hasFilters = params.category || params.condition || params.q

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-8">
      <div className="flex flex-col lg:flex-row gap-6">

        {/* Sidebar */}
        <aside className="w-full lg:w-[220px] shrink-0">
          <div className="bg-white rounded-[16px] p-5 sticky top-[82px] shadow-card">
            <form method="GET">
              {/* Preserve sort across filter submits */}
              {params.sort && <input type="hidden" name="sort" value={params.sort} />}

              {/* Search */}
              <div className="mb-5">
                <p className="text-[11px] font-sans font-semibold text-ink uppercase tracking-wider mb-2.5">Search</p>
                <input
                  name="q"
                  defaultValue={params.q}
                  placeholder="Drill pipe, BOP..."
                  className="w-full bg-bg border border-[#E8E9EA] text-ink placeholder:text-ink-3 px-3 py-2 text-sm font-sans rounded-[10px] focus:outline-none focus:border-orange transition-colors"
                />
              </div>

              {/* Category */}
              <div className="mb-5">
                <p className="text-[11px] font-sans font-semibold text-ink uppercase tracking-wider mb-2.5">Category</p>
                <div className="space-y-2">
                  {CATEGORIES.map(cat => (
                    <label key={cat.value} className="flex items-center gap-2.5 cursor-pointer group">
                      <input
                        type="radio"
                        name="category"
                        value={cat.value}
                        defaultChecked={params.category === cat.value}
                        className="w-3.5 h-3.5 accent-orange cursor-pointer"
                      />
                      <span className="text-sm font-sans text-ink-2 group-hover:text-ink transition-colors">
                        {cat.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Condition */}
              <div className="mb-5">
                <p className="text-[11px] font-sans font-semibold text-ink uppercase tracking-wider mb-2.5">Condition</p>
                <div className="space-y-2">
                  {CONDITIONS.map(c => (
                    <label key={c.value} className="flex items-center gap-2.5 cursor-pointer group">
                      <input
                        type="checkbox"
                        name="condition"
                        value={c.value}
                        defaultChecked={params.condition === c.value}
                        className="w-3.5 h-3.5 accent-orange cursor-pointer"
                      />
                      <span className="text-sm font-sans text-ink-2 group-hover:text-ink transition-colors">
                        {c.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div className="mb-5">
                <p className="text-[11px] font-sans font-semibold text-ink uppercase tracking-wider mb-2.5">Sort By</p>
                <select
                  name="sort"
                  defaultValue={params.sort ?? 'created_at:desc'}
                  className="w-full bg-bg border border-[#E8E9EA] text-ink px-3 py-2 text-sm font-sans rounded-[10px] focus:outline-none focus:border-orange transition-colors cursor-pointer"
                >
                  {SORT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Apply button */}
              <button
                type="submit"
                className="w-full py-2.5 text-sm font-bold text-white bg-orange rounded-pill hover:bg-orange-lt transition-colors shadow-orange-glow"
              >
                Apply Filters
              </button>

              {/* Clear all */}
              {hasFilters && (
                <a
                  href="/listings"
                  className="block text-center mt-3 text-sm font-sans font-semibold text-orange hover:text-orange-lt transition-colors"
                >
                  Clear all
                </a>
              )}
            </form>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">

          {/* Results count */}
          <p className="font-sans font-bold text-sm text-ink mb-5">
            {count} {count === 1 ? 'listing' : 'listings'} found
          </p>

          {listings && listings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(listings as Listing[]).map(listing => (
                <ListingCard key={listing.id} listing={listing} isLoggedIn={!!user} initialSaved={savedIds.has(listing.id)} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-[16px] flex flex-col items-center justify-center py-24 text-center shadow-card">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="font-sans font-bold text-lg text-ink">No listings found</h3>
              <p className="mt-2 text-sm font-sans text-ink-3 max-w-xs">
                Try adjusting your filters or{' '}
                <a href="/listings" className="text-orange hover:text-orange-lt font-semibold">view all listings</a>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
