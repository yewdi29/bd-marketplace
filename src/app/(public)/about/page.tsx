import Link from 'next/link'
import type { Metadata } from 'next'
import SellerPortalLink from '@/components/SellerPortalLink'
import CoreValuesAccordion from '@/components/about/CoreValuesAccordion'

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'Black Diamond Marketplace is the trusted marketplace for heavy equipment — built for oil and gas, construction, mining, agriculture, and forestry with AI verification and human care.',
  alternates: { canonical: 'https://blackdiamondmkt.com/about' },
}

/** Mid-fidelity content skeleton — black text on white only. No visual design pass yet. */
export default function AboutPage() {
  return (
    <div style={{ background: '#fff', color: '#000' }}>
      <div className="max-w-[1450px] mx-auto page-shell-x" style={{ paddingTop: '64px', paddingBottom: '96px' }}>
        {/* 1. Hero */}
        <section style={{ marginBottom: '72px' }}>
          <h1
            style={{
              margin: '0 0 16px',
              fontSize: '40px',
              fontWeight: 700,
              lineHeight: 1.15,
            }}
          >
            The trusted marketplace for heavy equipment
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: 400,
              lineHeight: 1.5,
            }}
          >
            Connecting serious buyers and sellers with verified listings, AI-backed sourcing, and
            real human support — so heavy equipment can move at the speed of the modern world.
          </p>
        </section>

        {/* 2. Why We Exist */}
        <section style={{ marginBottom: '72px' }}>
          <h2
            style={{
              margin: '0 0 16px',
              fontSize: '28px',
              fontWeight: 700,
              lineHeight: 1.25,
            }}
          >
            Why We Exist
          </h2>
          <p
            style={{
              margin: '0 0 16px',
              fontSize: '16px',
              fontWeight: 400,
              lineHeight: 1.7,
            }}
          >
            The equipment trade hasn&apos;t caught up to the pace of everything else. For decades,
            buying and selling heavy equipment has meant fragmented listings, word-of-mouth deals,
            and no real way to verify what you&apos;re actually getting — especially in specialized
            industries like oil and gas, where the stakes and the price tags are both high.
          </p>
          <p
            style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: 400,
              lineHeight: 1.7,
            }}
          >
            The world moves faster now, and this industry has to move with it. We believe AI is the
            tool that finally lets it — starting with how equipment gets sourced and verified in the
            first place, so buyers and sellers can move at the speed the rest of the world already
            expects.
          </p>
        </section>

        {/* 3. Mission */}
        <section style={{ marginBottom: '72px', textAlign: 'center' }}>
          <h2
            style={{
              margin: '0 0 24px',
              fontSize: '28px',
              fontWeight: 700,
              lineHeight: 1.25,
            }}
          >
            Our Mission
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: '24px',
              fontWeight: 600,
              lineHeight: 1.35,
            }}
          >
            The world moves fast. Heavy equipment should too.
          </p>
        </section>

        {/* 4. Core Values — future: photo beside accordion */}
        <section style={{ marginBottom: '72px' }}>
          <h2
            style={{
              margin: '0 0 16px',
              fontSize: '28px',
              fontWeight: 700,
              lineHeight: 1.25,
            }}
          >
            Our Core Values
          </h2>
          <CoreValuesAccordion />
        </section>

        {/* 5. A Faster Way to Buy and Sell */}
        <section style={{ marginBottom: '72px' }}>
          <h2
            style={{
              margin: '0 0 12px',
              fontSize: '28px',
              fontWeight: 700,
              lineHeight: 1.25,
            }}
          >
            A Faster Way to Buy and Sell
          </h2>
          <p
            style={{
              margin: '0 0 24px',
              fontSize: '20px',
              fontWeight: 400,
              lineHeight: 1.5,
            }}
          >
            List it, get matched, close the deal — backed by AI verification and real people at
            every step.
          </p>
          <Link
            href="/how-it-works"
            style={{
              display: 'inline-block',
              padding: '10px 16px',
              border: '1px solid #000',
              color: '#000',
              background: '#fff',
              fontSize: '16px',
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            See how it works
          </Link>
        </section>

        {/* 6. Where We're Going — future: custom animated visual */}
        <section style={{ marginBottom: '72px' }}>
          <h2
            style={{
              margin: '0 0 16px',
              fontSize: '28px',
              fontWeight: 700,
              lineHeight: 1.25,
            }}
          >
            Where We&apos;re Going
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: 400,
              lineHeight: 1.7,
            }}
          >
            Our goal isn&apos;t just to list equipment — it&apos;s to make the global heavy
            equipment trade move as fast, securely, and efficiently as the rest of the modern world
            already does. Oil and gas, construction, mining, agriculture, forestry — wherever heavy
            equipment moves, we want to be the fastest, most trustworthy way to move it.
          </p>
        </section>

        {/* 7. Founder's Note */}
        <section style={{ marginBottom: '72px' }}>
          <h2
            style={{
              margin: '0 0 16px',
              fontSize: '28px',
              fontWeight: 700,
              lineHeight: 1.25,
            }}
          >
            A Note From Our Founder
          </h2>
          <p
            style={{
              margin: '0 0 16px',
              fontSize: '16px',
              fontWeight: 400,
              lineHeight: 1.7,
            }}
          >
            Black Diamond was built because we believe heavy equipment trade can be faster, safer,
            and more transparent — without losing the human relationships that have always made this
            industry work. That&apos;s the balance we&apos;re building toward: not replacing the
            people in this business, but giving them better tools to move faster and trust more.
          </p>
          <p
            style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: 400,
              lineHeight: 1.7,
            }}
          >
            We&apos;re just getting started, and we believe this platform can be a real, positive
            force for the people and industries that keep the world running.
          </p>
        </section>

        {/* 8. Closing CTA */}
        <section>
          <h2
            style={{
              margin: '0 0 24px',
              fontSize: '28px',
              fontWeight: 700,
              lineHeight: 1.25,
            }}
          >
            Ready to get started?
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            <Link
              href="/search"
              style={{
                display: 'inline-block',
                padding: '10px 16px',
                border: '1px solid #000',
                color: '#000',
                background: '#fff',
                fontSize: '16px',
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              Browse Equipment
            </Link>
            <SellerPortalLink
              newListing
              style={{
                display: 'inline-block',
                padding: '10px 16px',
                border: '1px solid #000',
                color: '#000',
                background: '#fff',
                fontSize: '16px',
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              List Your Equipment
            </SellerPortalLink>
          </div>
        </section>
      </div>
    </div>
  )
}
