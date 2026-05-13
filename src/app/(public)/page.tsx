import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ListingCard from '@/components/ListingCard'
import NewsletterForm from '@/components/NewsletterForm'
import type { Listing } from '@/lib/types/database'

const CATEGORIES = [
  { label: 'Drill Pipe', slug: 'drill_pipe', icon: '⛏' },
  { label: 'Drilling Rigs', slug: 'rig', icon: '🏗' },
  { label: 'Blowout Preventers', slug: 'blowout_preventer', icon: '🔧' },
  { label: 'Pumping Units', slug: 'pumping_unit', icon: '⚙️' },
  { label: 'Wellheads', slug: 'wellhead', icon: '🛢' },
  { label: 'Compressors', slug: 'compressor', icon: '💨' },
  { label: 'Mud Pumps', slug: 'mud_pump', icon: '🔩' },
  { label: 'Tanks & Vessels', slug: 'tank', icon: '🛢' },
]

export default async function HomePage() {
  const supabase = await createClient()

  const { data: featuredListings } = await supabase
    .from('listings')
    .select('*, listing_images(*)')
    .eq('status', 'active')
    .eq('featured', true)
    .order('created_at', { ascending: false })
    .limit(6)

  const { data: recentListings } = await supabase
    .from('listings')
    .select('*, listing_images(*)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(8)

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">

      {/* Hero */}
      <section className="py-8">
        <div className="bg-white rounded-[20px] px-8 py-16 text-center shadow-card">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-orange-bg border border-orange-bdr rounded-pill px-4 py-1.5 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-orange animate-pulse" />
            <span className="font-mono text-[11px] font-bold text-orange uppercase tracking-wider">
              Heavy Equipment Marketplace
            </span>
          </div>

          {/* Headline */}
          <h1
            className="font-sans font-extrabold text-ink leading-[1.05] max-w-2xl mx-auto"
            style={{ fontSize: '42px', letterSpacing: '-0.03em' }}
          >
            Buy, Sell &amp; Trade Oil &amp; Gas{' '}
            <span className="text-orange">Equipment</span>
          </h1>

          {/* Subtext */}
          <p className="mt-5 text-[15px] font-sans text-ink-2 max-w-lg mx-auto leading-[1.7]">
            Drill pipe, rigs, BOP stacks, and more. Verified listings with expert broker support on high-value deals.
          </p>

          {/* Search bar */}
          <form
            action="/listings"
            method="GET"
            className="mt-8 max-w-xl mx-auto flex items-center bg-white border border-[#D4D5D7] rounded-pill px-2 py-2"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}
          >
            <select
              name="category"
              className="bg-transparent border-none text-sm font-sans font-medium text-ink px-3 focus:outline-none cursor-pointer shrink-0"
            >
              <option value="">All Equipment</option>
              {CATEGORIES.map(c => (
                <option key={c.slug} value={c.slug}>{c.label}</option>
              ))}
            </select>
            <div className="w-px h-5 bg-[#E8E9EA] mx-1 shrink-0" />
            <input
              type="text"
              name="q"
              placeholder="Search equipment..."
              className="flex-1 bg-transparent text-sm font-sans text-ink placeholder:text-ink-3 focus:outline-none px-3 min-w-0"
            />
            <button
              type="submit"
              className="shrink-0 px-6 py-2 text-sm font-bold text-white bg-orange rounded-pill hover:bg-orange-lt transition-colors shadow-orange-glow"
            >
              Search
            </button>
          </form>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-3 gap-8 max-w-sm mx-auto">
            {[
              { value: '500+', label: 'Active Listings' },
              { value: '$2B+', label: 'Equipment Value' },
              { value: '48H', label: 'Avg. Response' },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <div className="font-sans font-bold text-2xl text-ink">{stat.value}</div>
                <div className="font-sans text-xs text-ink-3 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-10">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="font-sans font-bold text-2xl text-ink" style={{ letterSpacing: '-0.02em' }}>Browse by Category</h2>
            <p className="mt-1 text-sm font-sans text-ink-3">Find the exact equipment you need</p>
          </div>
          <Link href="/listings" className="hidden sm:block text-sm font-sans font-semibold text-orange hover:text-orange-lt transition-colors">
            View all →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CATEGORIES.map(cat => (
            <Link
              key={cat.slug}
              href={`/listings?category=${cat.slug}`}
              className="group bg-white border border-[#E8E9EA] hover:border-[#D4D5D7] rounded-[16px] p-5 transition-all duration-200 hover:-translate-y-0.5 shadow-card hover:shadow-card-hover"
            >
              <span className="text-2xl">{cat.icon}</span>
              <p className="mt-3 font-sans text-sm font-semibold text-ink group-hover:text-orange transition-colors">
                {cat.label}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Listings */}
      {featuredListings && featuredListings.length > 0 && (
        <section className="py-10 border-t border-[#E8E9EA]">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="font-sans font-bold text-2xl text-ink" style={{ letterSpacing: '-0.02em' }}>Featured Equipment</h2>
              <p className="mt-1 text-sm font-sans text-ink-3">Hand-picked listings from verified sellers</p>
            </div>
            <Link href="/listings?featured=true" className="hidden sm:block text-sm font-sans font-semibold text-orange hover:text-orange-lt transition-colors">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(featuredListings as Listing[]).map(listing => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </section>
      )}

      {/* Recent Listings */}
      {recentListings && recentListings.length > 0 && (
        <section className="py-10 border-t border-[#E8E9EA]">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="font-sans font-bold text-2xl text-ink" style={{ letterSpacing: '-0.02em' }}>Recently Listed</h2>
              <p className="mt-1 text-sm font-sans text-ink-3">Fresh inventory added this week</p>
            </div>
            <Link href="/listings" className="hidden sm:block text-sm font-sans font-semibold text-orange hover:text-orange-lt transition-colors">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(recentListings as Listing[]).map(listing => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </section>
      )}

      {/* Newsletter */}
      <section className="py-10 border-t border-[#E8E9EA]">
        <div className="bg-white rounded-[20px] px-8 py-12 text-center shadow-card">
          <h2 className="font-sans font-bold text-2xl text-ink" style={{ letterSpacing: '-0.02em' }}>Stay in the Field</h2>
          <p className="mt-3 text-[15px] font-sans text-ink-3 max-w-md mx-auto leading-relaxed">
            New listings, market intel, and equipment guides delivered to your inbox. No noise — just signal.
          </p>
          <div className="mt-6 max-w-sm mx-auto">
            <NewsletterForm source="homepage" />
          </div>
        </div>
      </section>

      <div className="pb-16" />
    </div>
  )
}
