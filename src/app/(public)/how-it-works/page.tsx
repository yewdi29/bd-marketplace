'use client'

import { useState } from 'react'
import Link from 'next/link'
import SellerPortalLink from '@/components/SellerPortalLink'

const SELLERS_STEPS = [
  {
    title: 'Create your account',
    desc: 'Sign up in seconds. Free to join, no credit card required to get started.',
  },
  {
    title: 'Describe your equipment',
    desc: 'Tell our AI what you have. It builds a professional, SEO-optimized listing from your description in seconds.',
  },
  {
    title: 'Add photos and publish',
    desc: 'Upload up to 20 photos. Review your listing and publish with one click. Your equipment is live immediately.',
  },
  {
    title: 'Connect with buyers',
    desc: 'Receive inquiries directly through your listing. Respond, negotiate, and close deals on your terms.',
  },
]

const BUYERS_STEPS = [
  {
    title: 'Browse the marketplace',
    desc: 'Search thousands of listings by equipment type, condition, location, and price.',
  },
  {
    title: 'Find what you need',
    desc: "Use our intelligent search to find exact matches or discover related equipment you didn't know was available.",
  },
  {
    title: 'Contact the seller',
    desc: 'Send an inquiry directly through the listing. Your information goes straight to the seller — no middlemen.',
  },
  {
    title: 'Close the deal',
    desc: 'Work directly with the seller to inspect, negotiate, and finalize your purchase on your terms.',
  },
]

const FEATURES = [
  {
    icon: '⚡',
    title: 'AI-Powered Listings',
    desc: 'Describe your equipment in plain language. Our AI builds a complete, search-optimized listing in seconds.',
  },
  {
    icon: '🔍',
    title: 'Intelligent Search',
    desc: 'Find drill pipe, BOPs, rigs, and more using natural language. Our search understands oilfield terminology.',
  },
  {
    icon: '◆',
    title: 'BD Verified Sellers',
    desc: 'Premium members earn the BD Verified badge — a signal of credibility that buyers trust.',
  },
]

const FAQS = [
  {
    q: 'Is it free to create an account?',
    a: 'Yes. Creating an account and browsing listings is completely free. Sellers on the free plan can post up to 3 listings at no cost.',
  },
  {
    q: 'How does the AI listing generation work?',
    a: 'You describe your equipment in plain language — what it is, condition, specs, price, location. Our AI structures that into a professional listing with an SEO-optimized title, description, and specifications automatically.',
  },
  {
    q: 'How do buyers contact sellers?',
    a: "Buyers submit an inquiry form directly on the listing page. The seller receives the buyer's contact details and responds directly. Black Diamond facilitates the connection but the transaction happens between buyer and seller.",
  },
  {
    q: 'What is BD Verified?',
    a: 'BD Verified is a badge earned by sellers on paid membership plans. It signals to buyers that the seller is an active, committed member of the Black Diamond marketplace.',
  },
  {
    q: 'Can Black Diamond help close a deal?',
    a: 'Yes — for qualifying transactions sellers can authorize Black Diamond to assist with facilitation. Contact us to discuss brokerage options.',
  },
]

export default function HowItWorksPage() {
  const [activeTab, setActiveTab] = useState<'sellers' | 'buyers'>('sellers')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const steps = activeTab === 'sellers' ? SELLERS_STEPS : BUYERS_STEPS

  return (
    <div>
      {/* Hero */}
      <section
        className="text-center"
        style={{ background: '#1A1D20', padding: '64px 32px' }}
      >
        <p className="font-mono text-[11px] font-bold text-orange uppercase tracking-[0.12em] mb-4">
          HOW IT WORKS
        </p>
        <h1
          className="font-sans text-white mx-auto"
          style={{ fontSize: '44px', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05, maxWidth: '720px' }}
        >
          The simplest way to buy and sell oilfield equipment.
        </h1>
        <p
          className="font-sans text-white mx-auto mt-5"
          style={{ opacity: 0.7, maxWidth: '600px', fontSize: '17px', lineHeight: 1.7 }}
        >
          Whether you&rsquo;re moving iron or looking for it — Black Diamond connects you to the right people, fast.
        </p>
      </section>

      {/* Tab toggle */}
      <div className="bg-white border-b border-[#E8E9EA] flex justify-center" style={{ padding: '20px' }}>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('buyers')}
            className={`px-6 py-2 rounded-pill text-sm font-bold transition-all duration-200 border ${
              activeTab === 'buyers'
                ? 'bg-orange text-white border-orange shadow-orange-glow'
                : 'bg-white text-ink-2 border-[#D4D5D7] hover:border-orange hover:text-orange'
            }`}
          >
            For Buyers
          </button>
          <button
            onClick={() => setActiveTab('sellers')}
            className={`px-6 py-2 rounded-pill text-sm font-bold transition-all duration-200 border ${
              activeTab === 'sellers'
                ? 'bg-orange text-white border-orange shadow-orange-glow'
                : 'bg-white text-ink-2 border-[#D4D5D7] hover:border-orange hover:text-orange'
            }`}
          >
            For Sellers
          </button>
        </div>
      </div>

      {/* Steps section */}
      <section className="mx-auto" style={{ maxWidth: '900px', padding: '64px 32px' }}>
        <p className="font-mono text-[11px] font-bold text-orange uppercase tracking-[0.12em] mb-3">
          {activeTab === 'sellers' ? 'Sell With Us' : 'Find Equipment'}
        </p>
        <h2
          className="font-sans text-ink mb-12"
          style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.02em' }}
        >
          {activeTab === 'sellers'
            ? 'List your equipment in minutes.'
            : 'Find the iron your operation needs.'}
        </h2>

        {/* Timeline steps */}
        <div className="flex flex-col gap-10">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-6 items-start">
              {/* Step number circle */}
              <div className="shrink-0 flex flex-col items-center">
                <div
                  className="flex items-center justify-center text-white font-mono font-bold text-sm"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: '#FF6B35',
                    lineHeight: 1,
                  }}
                >
                  {i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div
                    className="mt-2"
                    style={{ width: 2, height: 32, background: '#E8E9EA' }}
                  />
                )}
              </div>
              {/* Content */}
              <div className="pt-1.5">
                <h3
                  className="font-sans text-ink mb-1.5"
                  style={{ fontSize: '17px', fontWeight: 700 }}
                >
                  {step.title}
                </h3>
                <p
                  className="font-sans text-ink-2"
                  style={{ fontSize: '15px', lineHeight: 1.7 }}
                >
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12">
          {activeTab === 'sellers' ? (
            <SellerPortalLink className="inline-flex items-center justify-center font-sans font-bold tracking-wide transition-all duration-200 rounded-pill bg-orange text-white hover:bg-orange-lt shadow-orange-glow px-8 py-3 text-base">
              Start Listing Equipment
            </SellerPortalLink>
          ) : (
            <Link href="/search">
              <span className="inline-flex items-center justify-center font-sans font-bold tracking-wide transition-all duration-200 rounded-pill bg-orange text-white hover:bg-orange-lt shadow-orange-glow px-8 py-3 text-base">
                Browse Equipment
              </span>
            </Link>
          )}
        </div>
      </section>

      {/* Why Black Diamond */}
      <section style={{ background: '#F7F8F9', padding: '64px 32px' }}>
        <div className="mx-auto" style={{ maxWidth: '1100px' }}>
          <h2
            className="font-sans text-ink text-center mb-10"
            style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.02em' }}
          >
            Why operators choose Black Diamond
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-white border border-[#E8E9EA] shadow-card"
                style={{ borderRadius: '16px', padding: '24px' }}
              >
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3
                  className="font-sans text-ink mb-2"
                  style={{ fontSize: '17px', fontWeight: 700 }}
                >
                  {f.title}
                </h3>
                <p className="font-sans text-ink-2" style={{ fontSize: '14px', lineHeight: 1.7 }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto" style={{ maxWidth: '720px', padding: '64px 32px' }}>
        <h2
          className="font-sans text-ink mb-8"
          style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.02em' }}
        >
          Common questions
        </h2>
        <div className="flex flex-col divide-y divide-[#E8E9EA]">
          {FAQS.map((faq, i) => (
            <div key={i}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between text-left py-5 gap-4"
              >
                <span
                  className="font-sans text-ink"
                  style={{ fontSize: '15px', fontWeight: 700 }}
                >
                  {faq.q}
                </span>
                <svg
                  className="shrink-0 transition-transform duration-200"
                  style={{ transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#9A9DA2"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {openFaq === i && (
                <p
                  className="font-sans text-ink-2 pb-5"
                  style={{ fontSize: '14px', lineHeight: 1.8 }}
                >
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Ready to Get Started — matches About page Join Us section */}
      <section className="bg-bg">
        <div className="max-w-[1450px] mx-auto page-shell-x py-12 md:py-16 text-center">
          <h2
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
          </h2>
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
        </div>
      </section>
    </div>
  )
}
