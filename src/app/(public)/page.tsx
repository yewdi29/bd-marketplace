import HeroGlobe from '@/components/home/HeroGlobe'
import Link from 'next/link'
import { Suspense } from 'react'
import NewsletterForm from '@/components/NewsletterForm'
import FeaturedEquipmentSection, { FeaturedCarouselSkeleton } from '@/components/home/FeaturedEquipmentSection'
import CategoryBrowse from '@/components/home/CategoryBrowse'
import HowItWorksSection from '@/components/home/HowItWorksSection'
import OperatorJournalSection from '@/components/home/OperatorJournalSection'

const INDUSTRY_TAGS = [
  { label: 'Energy',       dotColor: '#E8E9EA' },
  { label: 'Construction', dotColor: '#E8E9EA' },
  { label: 'Mining',       dotColor: '#E8E9EA' },
  { label: 'Agriculture',  dotColor: '#E8E9EA' },
]

export default function HomePage() {
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
       * ≥1500px: Globe.tsx centers the globe in the right half of the viewport
       * using pure viewport math — no DOM anchoring, no section constraints.
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
          className="page-shell flex flex-col min-[1000px]:grid min-[1000px]:grid-cols-[1.1fr_0.9fr] items-center relative z-[3] pointer-events-none"
        >
          {/* ── Left column ── */}
          <div className="py-10 min-[1000px]:py-[60px]">

            {/*
             * Frosted glass card — glassmorphism exception (navbar-only by default).
             * Approved by product owner. backdrop-filter blurs the globe behind it.
             * Padding scales down on mobile/tablet via Tailwind responsive classes.
             */}
            <div
              data-hero-card
              className="w-full min-[1000px]:w-fit min-[1000px]:max-w-full pointer-events-auto p-5 md:p-8 lg:px-[44px] lg:py-[40px] flex flex-col items-center text-center min-[1000px]:items-start min-[1000px]:text-left"
              style={{
                background: 'rgba(255,255,255,0.20)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.45)',
                borderRadius: '20px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
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
                className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 min-[1000px]:justify-start"
                style={{ marginBottom: '22px' }}
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
                className="mx-auto min-[1000px]:mx-0"
                style={{
                  fontSize: '16px',
                  color: '#6A6D72',
                  lineHeight: 1.75,
                  maxWidth: '440px',
                  marginBottom: '36px',
                  fontFamily: 'var(--font-inter, Inter, system-ui, sans-serif)',
                }}
              >
                Connecting buyers and sellers of heavy equipment worldwide since 2009.
                From oil fields to construction sites — find what your operation needs, fast.
              </p>

              {/* CTA buttons */}
              <div className="flex justify-center gap-3 min-[1000px]:justify-start" style={{ alignItems: 'center' }}>
                <Link
                  href="/search"
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
        <HeroGlobe />

      </section>

      {/* ── Below-fold content ────────────────────────────────────────────────── */}
      <div className="page-shell">

        {/* 1 ── Featured Equipment Carousel (streams after hero) */}
        <Suspense fallback={<FeaturedCarouselSkeleton />}>
          <FeaturedEquipmentSection />
        </Suspense>

        {/* 2 ── Browse by Category */}
        <CategoryBrowse />

        <hr className="border-0 border-t border-[#E8E9EA] m-0" />
      </div>

      <HowItWorksSection />

      {/* 5 ── Operator Journal */}
      <div className="page-shell">
        <Suspense fallback={null}>
          <OperatorJournalSection />
        </Suspense>
      </div>

      {/* 7 ── Newsletter */}
      <div className="page-shell">
        <section className="py-10 border-t border-[#E8E9EA]">
          <div className="bg-white rounded-[20px] px-8 py-12 text-center shadow-card">
            <h2
              className="font-sans font-bold text-2xl text-ink"
              style={{ letterSpacing: '-0.02em' }}
            >
              Stay Ahead of the Market.
            </h2>
            <p className="mt-3 text-[15px] font-sans text-ink-3 max-w-md mx-auto leading-relaxed">
              Get new listings, market insights, and equipment trends delivered to your inbox.
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
