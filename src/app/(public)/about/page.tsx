import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { canonicalUrl } from '@/lib/site'
import SellerPortalLink from '@/components/SellerPortalLink'
import CoreValuesAccordion from '@/components/about/CoreValuesAccordion'
import WhyWeExistIcon from '@/components/about/WhyWeExistIcon'
import MissionAsciiWave from '@/components/about/MissionAsciiWave'
import NewWayFlowDiagram from '@/components/about/NewWayFlowDiagram'

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'Black Diamond Marketplace is the trusted marketplace for heavy equipment — built for oil and gas, construction, mining, agriculture, and forestry with AI verification and human care.',
  alternates: { canonical: canonicalUrl('/about') },
}

/** Shared vertical rhythm between About sections */
const SECTION = 'py-12 md:py-16'

export default function AboutPage() {
  return (
    <div className="bg-bg">
      <div className="max-w-[1450px] mx-auto page-shell-x pt-8 pb-16 md:pt-10 md:pb-20">
        {/* 1. Hero */}
        <section className="mb-12 md:mb-16">
          <div className="relative overflow-hidden rounded-[20px] min-h-[380px] md:min-h-[460px]">
            <Image
              src="/about-hero.png"
              alt=""
              fill
              priority
              className="object-cover object-center"
              sizes="(max-width: 1450px) 100vw, 1450px"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, rgba(26,29,32,0.45) 0%, rgba(26,29,32,0.72) 100%)',
              }}
              aria-hidden
            />
            <div className="relative z-[1] flex flex-col items-center justify-center text-center px-8 py-16 sm:px-12 md:px-16 md:py-24 lg:px-24">
              <p className="font-mono text-[11px] font-bold text-orange uppercase tracking-[0.12em] mb-4">
                ABOUT US
              </p>
              <h1
                className="font-sans text-white max-w-[820px]"
                style={{
                  fontSize: 'clamp(36px, 6vw, 44px)',
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  lineHeight: 1.05,
                  margin: 0,
                }}
              >
                The Trusted Marketplace For Heavy Equipment
              </h1>
              <p
                className="font-sans text-white max-w-[640px] mt-5"
                style={{
                  marginBottom: 0,
                  fontSize: '15px',
                  fontWeight: 400,
                  lineHeight: 1.7,
                  opacity: 0.85,
                }}
              >
                Connecting Serious Buyers And Sellers With Verified Listings, AI-Backed Sourcing, And
                Real Human Support — So Heavy Equipment Can Move At The Speed Of The Modern World.
              </p>
            </div>
          </div>
        </section>

        {/* 2. Why We Exist */}
        <section className={SECTION}>
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] gap-10 lg:gap-14 items-center">
            <div className="text-left min-w-0">
              <h1
                className="font-sans text-ink"
                style={{
                  margin: '0 0 16px',
                  fontSize: 'clamp(36px, 6vw, 44px)',
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  lineHeight: 1.05,
                }}
              >
                Why We Exist
              </h1>
              <p
                className="font-sans text-ink-2"
                style={{
                  margin: '0 0 14px',
                  fontSize: '15px',
                  fontWeight: 400,
                  lineHeight: 1.7,
                }}
              >
                The equipment trade hasn&apos;t caught up to the pace of everything else. For decades,
                buying and selling heavy equipment has meant fragmented listings, word-of-mouth deals,
                and no real way to verify what you&apos;re actually getting.
              </p>
              <p
                className="font-sans text-ink-2"
                style={{
                  margin: 0,
                  fontSize: '15px',
                  fontWeight: 400,
                  lineHeight: 1.7,
                }}
              >
                The world moves faster now, and this industry has to move with it. We believe AI is the
                tool that finally lets it — starting with how equipment gets sourced and verified in the
                first place, so buyers and sellers can move at the speed of evolution with even more
                security.
              </p>
            </div>

            <div className="flex justify-center lg:justify-end">
              <WhyWeExistIcon />
            </div>
          </div>
        </section>

        {/* 3. Mission */}
        <section className={SECTION}>
          <div
            className="relative overflow-hidden rounded-[20px] text-center px-8 py-14 sm:px-12 md:px-16 md:py-16 lg:px-24"
            style={{ background: '#F0F0F0', textAlign: 'center' }}
          >
            <MissionAsciiWave />
            <div className="relative z-[1]">
              <p
                className="font-mono text-[11px] font-bold text-orange uppercase tracking-[0.12em] mb-4 text-center"
                style={{ textAlign: 'center' }}
              >
                OUR MISSION
              </p>
              <h1
                className="font-sans text-ink text-center mx-auto"
                style={{
                  margin: '0 auto',
                  maxWidth: '820px',
                  fontSize: 'clamp(36px, 6vw, 44px)',
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  lineHeight: 1.05,
                  textAlign: 'center',
                }}
              >
                Connect Heavy Equipment Buyers And Sellers Faster Than Ever.
              </h1>
            </div>
          </div>
        </section>

        {/* 4. Core Values */}
        <section className={SECTION}>
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] gap-10 lg:gap-14 items-start">
            <div className="text-left min-w-0">
              <p className="font-mono text-[11px] font-bold text-orange uppercase tracking-[0.12em] mb-5">
                CORE VALUES
              </p>
              <CoreValuesAccordion />
            </div>

            <div className="relative w-full max-w-[420px] mx-auto lg:max-w-none lg:mx-0 lg:justify-self-end">
              <div
                className="relative w-full overflow-hidden rounded-[20px]"
                style={{ aspectRatio: '1 / 1' }}
              >
                <Image
                  src="/about-core-values.png"
                  alt=""
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 1024px) 90vw, 420px"
                />
              </div>
            </div>
          </div>
        </section>

        {/* 5. A New Way to Buy and Sell */}
        <section className={SECTION}>
          <NewWayFlowDiagram />
        </section>

        {/* 6. Ready to Get Started */}
        <section className={`${SECTION} text-center`}>
          <h1
            className="font-sans text-ink mx-auto"
            style={{
              margin: '0 auto 16px',
              maxWidth: '720px',
              fontSize: 'clamp(36px, 6vw, 44px)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.05,
              textAlign: 'center',
            }}
          >
            Join Us To Get Started!
          </h1>
          <p
            className="font-sans text-ink-2 mx-auto"
            style={{
              margin: '0 auto 28px',
              maxWidth: '540px',
              fontSize: '15px',
              fontWeight: 400,
              lineHeight: 1.7,
              textAlign: 'center',
            }}
          >
            Ready to list your equipment or browse machinery on your radar? Become a member to get
            started.
          </p>
          <div className="flex flex-col items-stretch gap-3 w-full max-w-sm mx-auto sm:max-w-none sm:flex-row sm:items-center sm:justify-center">
            <Link
              href="/search"
              className="inline-flex items-center justify-center w-full min-h-12 px-6 py-3 text-sm font-bold rounded-pill font-sans no-underline transition-all duration-200 bg-transparent text-ink-2 border border-[#D4D5D7] hover:text-orange hover:border-orange sm:w-auto sm:min-h-0 sm:py-2.5"
            >
              Browse Equipment
            </Link>
            <SellerPortalLink
              newListing
              className="inline-flex items-center justify-center w-full min-h-12 px-6 py-3 text-sm font-bold rounded-pill font-sans no-underline transition-all duration-200 bg-orange text-white hover:bg-orange-lt sm:w-auto sm:min-h-0 sm:py-2.5"
              style={{ boxShadow: '0 4px 16px rgba(255,107,53,0.30)' }}
            >
              List Equipment
            </SellerPortalLink>
          </div>
        </section>
      </div>
    </div>
  )
}
