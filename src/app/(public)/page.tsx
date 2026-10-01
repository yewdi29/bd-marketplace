import HeroGlobeLazy from '@/components/home/HeroGlobeLazy'
import HeroListEquipmentLink from '@/components/home/HeroListEquipmentLink'
import { HERO_CTA_OUTLINE, HERO_CTA_ROW } from '@/components/home/heroCtaClasses'
import Link from 'next/link'
import type { Metadata } from 'next'
import { DM_Mono } from 'next/font/google'
import Image from 'next/image'
import { canonicalUrl } from '@/lib/site'
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

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Oilfield & Heavy Equipment for Sale',
  description:
    'Create a free account, list your equipment, and get in front of real buyers.',
  alternates: { canonical: canonicalUrl() },
  openGraph: {
    url: canonicalUrl(),
    title: 'Oilfield & Heavy Equipment for Sale | Black Diamond Marketplace',
    images: [
      {
        url: '/main-share-img.png',
        width: 1200,
        height: 630,
        alt: "Black Diamond Marketplace — The World's Heavy Equipment Marketplace",
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/main-share-img.png'],
  },
}

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
              <div className="mb-7 flex w-full justify-center min-[1000px]:justify-start">
                <Image
                  src="/bd_logo-wordmark.svg"
                  alt="Black Diamond"
                  width={244}
                  height={29}
                  priority
                  style={{ height: '32px', width: 'auto' }}
                />
              </div>

              <h1
                style={{
                  fontFamily: 'var(--font-inter, Inter, system-ui, sans-serif)',
                  fontSize: 'clamp(36px, 5vw, 58px)',
                  fontWeight: 900,
                  letterSpacing: '-0.04em',
                  lineHeight: 1.02,
                  color: '#1A1D20',
                  marginBottom: '18px',
                }}
              >
                Machinery Deals Made Easy.
              </h1>

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
                Create a free account, list your equipment, and get in front of real buyers.
              </p>

              <div className={HERO_CTA_ROW}>
                <HeroListEquipmentLink />
                <Link href="/search" className={HERO_CTA_OUTLINE}>
                  Browse equipment
                </Link>
              </div>

              <p
                className={`${dmMono.className} w-full text-center min-[1000px]:text-left`}
                style={{
                  marginTop: '28px',
                  background: '#F7F8F9',
                  color: '#1A1D20',
                  fontSize: '13px',
                  fontWeight: 500,
                  lineHeight: 1.5,
                  borderRadius: '10px',
                  padding: '10px 14px',
                }}
              >
                First 100 sellers get 3 months of Starter or Pro on us. Then full price.
              </p>
            </div>
          </div>

          <div className="hidden min-[1000px]:block" style={{ minHeight: '500px' }} />
        </div>

        <div className="hidden min-[1000px]:block">
          <HeroGlobeLazy />
        </div>
      </section>

      {/* ── How It Works (static header server; animation deferred client) ─── */}
      <Suspense fallback={<HowItWorksSkeleton />}>
        <section className="w-full py-16 lg:py-20">
          <HowItWorksHeader />
          <HowItWorksLazy />
        </section>
      </Suspense>

      {/* ── Featured (thin) then industry browse ───────────────────────────── */}
      <div className="page-shell">
        <Suspense fallback={<FeaturedCarouselSkeleton />}>
          <FeaturedEquipmentSection />
        </Suspense>

        <Suspense fallback={<CategoryBrowseSkeleton />}>
          <CategoryBrowse />
        </Suspense>

        <hr className="border-0 border-t border-[#E8E9EA] m-0" />
      </div>

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
