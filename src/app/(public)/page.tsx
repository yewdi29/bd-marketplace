import HeroGlobeLazy from '@/components/home/HeroGlobeLazy'
import HeroListEquipmentLink from '@/components/home/HeroListEquipmentLink'
import { HERO_CTA_OUTLINE, HERO_CTA_ROW } from '@/components/home/heroCtaClasses'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import FeaturedEquipmentSection, { FeaturedCarouselSkeleton } from '@/components/home/FeaturedEquipmentSection'
import CategoryBrowse from '@/components/home/CategoryBrowse'
import HowItWorksHeader from '@/components/home/HowItWorksHeader'
import HowItWorksLazy from '@/components/home/HowItWorksLazy'
import NewsletterSection from '@/components/NewsletterSection'
import OperatorJournalSection from '@/components/home/OperatorJournalSection'
import {
  CategoryBrowseSkeleton,
  HowItWorksSkeleton,
  NewsletterSkeleton,
  OperatorJournalSkeleton,
} from '@/components/home/HomeSectionSkeletons'

export const metadata: Metadata = {
  title: "The World's Heavy Equipment Marketplace",
  description:
    'Source heavy equipment from verified sellers across oil and gas, construction, mining, agriculture, and forestry. Buy and sell globally on Black Diamond Marketplace.',
  alternates: { canonical: 'https://blackdiamondmkt.com' },
  openGraph: {
    url: 'https://blackdiamondmkt.com',
    title: "Black Diamond Marketplace — The World's Heavy Equipment Marketplace",
  },
}

const INDUSTRY_TAGS = [
  { label: 'Energy',       dotColor: '#E8E9EA' },
  { label: 'Construction', dotColor: '#E8E9EA' },
  { label: 'Mining',       dotColor: '#E8E9EA' },
  { label: 'Agriculture',  dotColor: '#E8E9EA' },
]

export default function HomePage() {
  return (
    <>
      {/* ── Hero (server-rendered; globe is a deferred client island) ──────── */}
      <section data-hero-section className="relative overflow-hidden min-h-[75vh]">
        <div
          className="absolute bottom-0 left-0 right-0 w-full pointer-events-none"
          style={{
            height: '140px',
            background: 'linear-gradient(to top, #F7F8F9 0%, transparent 100%)',
            zIndex: 2,
          }}
        />

        <div
          data-hero-container
          className="page-shell flex flex-col min-[1000px]:grid min-[1000px]:grid-cols-[1.1fr_0.9fr] items-center relative z-[3] pointer-events-none"
        >
          <div className="py-10 min-[1000px]:py-[60px]">
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

              <div className={HERO_CTA_ROW}>
                <Link href="/search" className={HERO_CTA_OUTLINE}>
                  Browse Equipment
                </Link>
                <HeroListEquipmentLink />
              </div>
            </div>
          </div>

          <div className="hidden min-[1000px]:block" style={{ minHeight: '500px' }} />
        </div>

        <div className="hidden min-[1000px]:block">
          <HeroGlobeLazy />
        </div>
      </section>

      {/* ── Featured equipment (async server + small client islands per card) ─ */}
      <div className="page-shell">
        <Suspense fallback={<FeaturedCarouselSkeleton />}>
          <FeaturedEquipmentSection />
        </Suspense>

        <Suspense fallback={<CategoryBrowseSkeleton />}>
          <CategoryBrowse />
        </Suspense>

        <hr className="border-0 border-t border-[#E8E9EA] m-0" />
      </div>

      {/* ── How It Works (static header server; animation deferred client) ─── */}
      <Suspense fallback={<HowItWorksSkeleton />}>
        <section className="w-full py-16 lg:py-20">
          <HowItWorksHeader />
          <HowItWorksLazy />
        </section>
      </Suspense>

      {/* ── Operator Journal (async server, streams independently) ───────── */}
      <div className="page-shell">
        <Suspense fallback={<OperatorJournalSkeleton />}>
          <OperatorJournalSection />
        </Suspense>
      </div>

      {/* ── Newsletter (server shell + deferred form island) ───────────────── */}
      <div className="page-shell pb-16">
        <Suspense fallback={<NewsletterSkeleton />}>
          <NewsletterSection />
        </Suspense>
      </div>
    </>
  )
}
