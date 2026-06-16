import dynamic from 'next/dynamic'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ListingCard from '@/components/ListingCard'
import NewsletterForm from '@/components/NewsletterForm'
import type { Listing } from '@/lib/types/database'

// Globe uses WebGL — must be client-only
const Globe = dynamic(() => import('@/components/ui/Globe'), { ssr: false })

export default async function HomePage() {
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

  const INDUSTRY_TAGS = [
    { label: 'Energy',       dotColor: '#E8E9EA' },
    { label: 'Construction', dotColor: '#E8E9EA' },
    { label: 'Mining',       dotColor: '#E8E9EA' },
    { label: 'Agriculture',  dotColor: '#E8E9EA' },
  ]

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      {/*
       * Z-index stack (all relative to this section):
       *   Globe container  → z-1  (painted first — backdrop-filter blurs it)
       *   Bottom fade      → z-2  (hides globe bleed at the bottom)
       *   Grid + glass card → z-3 (content always on top)
       *
       * Mobile (<730px): flex-col — card first, then globe as a 360px flow element.
       * Tablet (730–1000px): same flow layout, taller container.
       * Desktop (≥1000px): globe is position:absolute; section is the offset parent.
       * overflow-hidden clips the globe at the section boundary on all desktop modes.
       *
       * ≥1500px: Globe.tsx centers the globe in the right half of the 1280px content
       * container using pure viewport math — no DOM anchoring, no section constraints.
       */}
      <section data-hero-section className="relative overflow-hidden min-h-[75vh]">

        {/* Bottom fade — full width, above globe (z-2), below content (z-3) */}
        <div
          className="absolute bottom-0 left-0 right-0 w-full pointer-events-none"
          style={{
            height: '140px',
            background: 'linear-gradient(to top, #F7F8F9 0%, transparent 100%)',
            zIndex: 2,
          }}
        />

        {/* Two-column grid — single column stack on mobile, side-by-side on md+.
            position: relative + z-[3] keeps content above the absolute globe. */}
        <div
          data-hero-container
          className="flex flex-col min-[1000px]:grid min-[1000px]:grid-cols-[1.1fr_0.9fr] items-center relative z-[3] pointer-events-none"
          style={{ maxWidth: '1280px', margin: '0 auto' }}
        >
          {/* ── Left column ── */}
          <div className="px-4 py-10 min-[1000px]:pl-16 min-[1000px]:pr-0 min-[1000px]:py-[60px]">

            {/*
             * Frosted glass card — glassmorphism exception (navbar-only by default).
             * Approved by product owner. backdrop-filter blurs the globe behind it.
             * Padding scales down on mobile/tablet via Tailwind responsive classes.
             */}
            <div
              data-hero-card
              className="w-full pointer-events-auto p-5 md:p-8 lg:px-[44px] lg:py-[40px]"
              style={{
                background: 'rgba(255,255,255,0.20)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.45)',
                borderRadius: '20px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
              }}
            >
              {/* Eyebrow pill */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(255,107,53,0.07)',
                  border: '1px solid rgba(255,107,53,0.18)',
                  borderRadius: '100px',
                  padding: '5px 13px',
                  marginBottom: '28px',
                }}
              >
                <span
                  className="animate-pulse"
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#FF6B35',
                    flexShrink: 0,
                    display: 'inline-block',
                  }}
                />
                <span
                  style={{
                    fontFamily: 'var(--font-mono, "Andale Mono", monospace)',
                    fontSize: '10px',
                    fontWeight: 500,
                    color: '#FF6B35',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  Thousands of visitors globally
                </span>
              </div>

              {/* Headline */}
              <h1
                style={{
                  fontFamily: 'var(--font-inter, Inter, system-ui, sans-serif)',
                  fontSize: '58px',
                  fontWeight: 900,
                  letterSpacing: '-0.04em',
                  lineHeight: 1.02,
                  color: '#1A1D20',
                  marginBottom: '18px',
                }}
              >
                Your Global Source
                <br />
                <span style={{ color: '#FF6B35' }}>for Heavy Equipment</span>
              </h1>

              {/* Industry tags */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  marginBottom: '22px',
                }}
              >
                {INDUSTRY_TAGS.map(tag => (
                  <div key={tag.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: tag.dotColor,
                        flexShrink: 0,
                        display: 'inline-block',
                      }}
                    />
                    <span
                      style={{
                        fontSize: '12px',
                        color: '#9A9DA2',
                        fontWeight: 500,
                        fontFamily: 'var(--font-inter, Inter, system-ui, sans-serif)',
                      }}
                    >
                      {tag.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Subtitle */}
              <p
                style={{
                  fontSize: '16px',
                  color: '#6A6D72',
                  lineHeight: 1.75,
                  maxWidth: '440px',
                  marginBottom: '36px',
                  fontFamily: 'var(--font-inter, Inter, system-ui, sans-serif)',
                }}
              >
                Connecting buyers and sellers of heavy equipment worldwide since 2009. From oil fields to construction sites — find what your operation needs, fast.
              </p>

              {/* CTA buttons */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <Link
                  href="/listings"
                  className="inline-flex items-center px-[18px] py-2 bg-white text-ink border border-[#E8E9EA] rounded-pill font-bold text-[13px] no-underline whitespace-nowrap font-sans transition-all duration-200 hover:text-orange hover:border-orange"
                >
                  Browse Equipment
                </Link>
                <Link
                  href="/how-it-works"
                  className="inline-flex items-center px-[18px] py-2 bg-orange text-white rounded-pill font-bold text-[13px] no-underline whitespace-nowrap font-sans transition-all duration-200 hover:bg-orange-lt"
                  style={{ boxShadow: '0 6px 20px rgba(255,107,53,0.3)' }}
                >
                  List Your Equipment
                </Link>
              </div>
            </div>
          </div>

          {/* Right column spacer — hidden when stacked, reserves space for the globe ≥1000px */}
          <div className="hidden min-[1000px]:block" style={{ minHeight: '500px' }} />
        </div>

        {/* Globe is self-positioning — breakpoint logic lives in Globe.tsx */}
        <Globe />

      </section>

      {/* ── Below-fold content ────────────────────────────────────────────────── */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">

        {/* Featured Listings */}
        {featuredListings && featuredListings.length > 0 && (
          <section className="py-10 border-t border-[#E8E9EA]">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="font-sans font-bold text-2xl text-ink" style={{ letterSpacing: '-0.02em' }}>
                  Featured Equipment
                </h2>
                <p className="mt-1 text-sm font-sans text-ink-3">Hand-picked listings from verified sellers</p>
              </div>
              <Link
                href="/listings?featured=true"
                className="hidden sm:block text-sm font-sans font-semibold text-orange hover:text-orange-lt transition-colors"
              >
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(featuredListings as Listing[]).map(listing => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  isLoggedIn={!!user}
                  initialSaved={savedIds.has(listing.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Recently Listed */}
        {recentListings && recentListings.length > 0 && (
          <section className="py-10 border-t border-[#E8E9EA]">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="font-sans font-bold text-2xl text-ink" style={{ letterSpacing: '-0.02em' }}>
                  Recently Listed
                </h2>
                <p className="mt-1 text-sm font-sans text-ink-3">Fresh inventory added this week</p>
              </div>
              <Link
                href="/listings"
                className="hidden sm:block text-sm font-sans font-semibold text-orange hover:text-orange-lt transition-colors"
              >
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {(recentListings as Listing[]).map(listing => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  isLoggedIn={!!user}
                  initialSaved={savedIds.has(listing.id)}
                />
              ))}
            </div>
          </section>
        )}

      </div>

      {/* ── How It Works ──────────────────────────────────────────────────────── */}
      <section style={{ background: '#F7F8F9', width: '100%', padding: '80px 32px', borderTop: '1px solid #E8E9EA' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

          {/* Top label */}
          <p style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: '10px',
            fontWeight: 500,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.1em',
            color: '#FF6B35',
            marginBottom: '12px',
          }}>
            HOW IT WORKS
          </p>

          {/* Headline */}
          <h2 style={{
            fontFamily: 'var(--font-inter, Inter, system-ui, sans-serif)',
            fontSize: '36px',
            fontWeight: 800,
            color: '#1A1D20',
            letterSpacing: '-0.02em',
            marginBottom: '56px',
            margin: '0 0 56px 0',
          }}>
            List your equipment in three steps.
          </h2>

          {/* Cards + decorative connector line */}
          <div style={{ position: 'relative' }}>

            {/* Connector line — sits behind the cards */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '8%',
              right: '8%',
              height: '1px',
              background: '#E8E9EA',
              zIndex: 0,
              transform: 'translateY(-50%)',
            }} />

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '24px',
              position: 'relative',
              zIndex: 1,
            }}>
              {([
                {
                  num: '01',
                  title: 'Describe Your Equipment',
                  desc: 'Tell our AI what you have in plain language — condition, specs, price, and location. Just talk to us like you would a buyer.',
                },
                {
                  num: '02',
                  title: 'Publish Instantly',
                  desc: 'Review your AI-generated listing, add photos, and publish with one click. Your equipment is live and searchable worldwide immediately.',
                },
                {
                  num: '03',
                  title: 'Connect and Close',
                  desc: 'Buyers find your listing and contact you directly through the inquiry form. No middlemen, no fees per transaction. Just direct connections.',
                },
              ] as const).map(step => (
                <div key={step.num} style={{
                  background: 'white',
                  border: '1px solid #E8E9EA',
                  borderRadius: '16px',
                  padding: '28px',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                }}>
                  <p style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: '11px',
                    fontWeight: 500,
                    color: '#FF6B35',
                    letterSpacing: '0.1em',
                    marginBottom: '16px',
                  }}>
                    {step.num}
                  </p>
                  <h3 style={{
                    fontFamily: 'var(--font-inter, Inter, system-ui, sans-serif)',
                    fontSize: '16px',
                    fontWeight: 700,
                    color: '#1A1D20',
                    marginBottom: '10px',
                  }}>
                    {step.title}
                  </h3>
                  <p style={{
                    fontFamily: 'var(--font-inter, Inter, system-ui, sans-serif)',
                    fontSize: '14px',
                    color: '#6A6D72',
                    lineHeight: 1.7,
                    margin: 0,
                  }}>
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA row */}
          <div style={{ marginTop: '48px', display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <Link
              href="/auth/signup"
              className="inline-flex items-center font-sans font-bold text-[13px] text-white no-underline whitespace-nowrap rounded-pill transition-all duration-200 hover:bg-orange-lt"
              style={{ background: '#FF6B35', padding: '10px 24px', boxShadow: '0 4px 16px rgba(255,107,53,0.30)' }}
            >
              Start Listing Equipment
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center font-sans font-bold text-[13px] no-underline whitespace-nowrap rounded-pill transition-all duration-200 hover:border-[#D4D5D7] hover:text-ink"
              style={{ border: '1px solid #E8E9EA', padding: '10px 24px', color: '#4A4D52', background: 'white' }}
            >
              See Full Guide
            </Link>
          </div>

        </div>
      </section>

      {/* ── Newsletter + bottom padding ───────────────────────────────────────── */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">

        {/* Newsletter */}
        <section className="py-10 border-t border-[#E8E9EA]">
          <div className="bg-white rounded-[20px] px-8 py-12 text-center shadow-card">
            <h2 className="font-sans font-bold text-2xl text-ink" style={{ letterSpacing: '-0.02em' }}>
              Stay in the Field
            </h2>
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
    </>
  )
}
