import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Button from '@/components/ui/Button'
import ListingCard from '@/components/ListingCard'
import TierBadge from '@/components/TierBadge'
import type { Listing } from '@/lib/types/database'
import NewsletterForm from '@/components/NewsletterForm'

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

const TIER_INFO = [
  {
    tier: 'green' as const,
    label: 'Green Tier',
    range: 'Under $100K',
    description: 'Self-service listings. Direct buyer–seller contact. Instant listing activation.',
  },
  {
    tier: 'yellow' as const,
    label: 'Yellow Tier',
    range: '$100K – $500K',
    description: 'BD broker introduction. Deal facilitation. Commission-based transaction support.',
  },
  {
    tier: 'red' as const,
    label: 'Red Tier',
    range: 'Over $500K',
    description: 'Full white-glove service. Dedicated deal team. Escrow coordination available.',
  },
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
    <>
      {/* Hero */}
      <section className="relative min-h-[88vh] flex items-center justify-center overflow-hidden">
        {/* Background grid */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'linear-gradient(rgba(200,168,75,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(200,168,75,0.3) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-6 inline-flex items-center gap-2 border border-gold/30 px-4 py-1.5">
            <span className="w-1.5 h-1.5 bg-gold rounded-full animate-pulse" />
            <span className="font-body text-xs text-gold tracking-widest uppercase">
              The #1 Oil &amp; Gas Equipment Exchange
            </span>
          </div>

          <h1 className="font-display text-6xl sm:text-8xl lg:text-[120px] tracking-widest text-white leading-none">
            BLACK
            <br />
            <span className="text-gold">DIAMOND</span>
          </h1>
          <p className="mt-6 font-display text-xl sm:text-2xl tracking-widest text-gray-400 uppercase">
            Heavy Equipment Marketplace
          </p>

          <p className="mt-6 max-w-2xl mx-auto font-body text-base text-gray-500 leading-relaxed">
            Buy and sell premium oil &amp; gas equipment. Drill pipe, rigs, BOP stacks, and more.
            Verified listings. Expert broker support on high-value deals.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/listings">
              <Button variant="primary" size="lg" className="w-full sm:w-auto font-display tracking-widest">
                BROWSE EQUIPMENT
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button variant="outline" size="lg" className="w-full sm:w-auto font-display tracking-widest">
                LIST YOUR EQUIPMENT
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            {[
              { value: '500+', label: 'Active Listings' },
              { value: '$2B+', label: 'Equipment Value' },
              { value: '48H', label: 'Avg. Response' },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <div className="font-display text-3xl text-gold tracking-wide">{stat.value}</div>
                <div className="font-body text-xs text-gray-600 mt-1 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 border-t border-surface-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="font-display text-4xl tracking-widest text-white">BROWSE BY CATEGORY</h2>
              <p className="mt-2 font-body text-sm text-gray-500">Find the exact equipment you need</p>
            </div>
            <Link href="/listings" className="hidden sm:block font-body text-sm text-gold hover:text-gold-light transition-colors">
              View all →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CATEGORIES.map(cat => (
              <Link
                key={cat.slug}
                href={`/listings?category=${cat.slug}`}
                className="group p-4 border border-surface-border bg-surface hover:border-gold/50 hover:bg-surface-elevated transition-all duration-200"
              >
                <span className="text-2xl">{cat.icon}</span>
                <p className="mt-2 font-body text-sm font-medium text-gray-300 group-hover:text-gold transition-colors">
                  {cat.label}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      {featuredListings && featuredListings.length > 0 && (
        <section className="py-20 border-t border-surface-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="font-display text-4xl tracking-widest text-white">FEATURED EQUIPMENT</h2>
                <p className="mt-2 font-body text-sm text-gray-500">Hand-picked listings from verified sellers</p>
              </div>
              <Link href="/listings?featured=true" className="hidden sm:block font-body text-sm text-gold hover:text-gold-light transition-colors">
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(featuredListings as Listing[]).map(listing => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recent Listings */}
      {recentListings && recentListings.length > 0 && (
        <section className="py-20 border-t border-surface-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="font-display text-4xl tracking-widest text-white">RECENTLY LISTED</h2>
                <p className="mt-2 font-body text-sm text-gray-500">Fresh inventory added this week</p>
              </div>
              <Link href="/listings" className="hidden sm:block font-body text-sm text-gold hover:text-gold-light transition-colors">
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {(recentListings as Listing[]).map(listing => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Tier System */}
      <section className="py-20 border-t border-surface-border bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl tracking-widest text-white">TRAFFIC LIGHT ROUTING</h2>
            <p className="mt-3 font-body text-sm text-gray-500 max-w-xl mx-auto">
              Every listing is automatically tiered by price, routing deals to the right level of broker support.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TIER_INFO.map(info => (
              <div key={info.tier} className="border border-surface-border p-6 bg-background">
                <TierBadge tier={info.tier} showLabel size="md" />
                <p className="mt-3 font-body text-sm text-gray-400 leading-relaxed">{info.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-20 border-t border-surface-border">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-4xl tracking-widest text-white">STAY IN THE FIELD</h2>
          <p className="mt-3 font-body text-sm text-gray-500 leading-relaxed">
            New listings, market intel, and equipment guides delivered to your inbox. No noise — just signal.
          </p>
          <div className="mt-8">
            <NewsletterForm source="homepage" />
          </div>
        </div>
      </section>
    </>
  )
}
