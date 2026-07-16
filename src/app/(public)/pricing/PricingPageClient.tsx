'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import EnterpriseTierBlock from '@/components/pricing/EnterpriseTierBlock'
import { PlanDiamondMark } from '@/components/ui/PlanBadge'

type BillingCycle = 'monthly' | 'annual'

interface TierFeature {
  label: string
  included: boolean
}

interface PaidTier {
  id: 'starter' | 'pro' | 'max'
  name: string
  monthly: number
  annualPerMonth: number
  annualTotal: number
  annualSavings: number
  listingLabel: string
  popular: boolean
  features: TierFeature[]
}

const FREE_FEATURES: TierFeature[] = [
  { label: '3 active listings', included: true },
  { label: 'AI listing generation', included: true },
  { label: 'Basic search visibility', included: true },
  { label: 'BD Verified badge', included: false },
  { label: 'Directory page listing', included: false },
  { label: 'Priority placement', included: false },
]

const PAID_TIERS: PaidTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    monthly: 299,
    annualPerMonth: 267,
    annualTotal: 3200,
    annualSavings: 388,
    listingLabel: '15 listings',
    popular: false,
    features: [
      { label: '15 active listings', included: true },
      { label: 'AI listing generation', included: true },
      { label: 'BD Verified badge', included: true },
      { label: 'Analytics per listing', included: true },
      { label: 'Video upload', included: true },
      { label: 'Priority search placement', included: true },
      { label: 'Directory page listing', included: false },
      { label: 'Newsletter features', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    monthly: 699,
    annualPerMonth: 625,
    annualTotal: 7500,
    annualSavings: 888,
    listingLabel: '40 listings',
    popular: true,
    features: [
      { label: '40 active listings', included: true },
      { label: 'AI listing generation', included: true },
      { label: 'BD Verified badge', included: true },
      { label: 'Directory page listing', included: true },
      { label: 'Monthly analytics report', included: true },
      { label: '1 newsletter feature/week', included: true },
      { label: 'All Starter features', included: true },
      { label: 'Exclusive newsletter blast', included: false },
    ],
  },
  {
    id: 'max',
    name: 'Max',
    monthly: 999,
    annualPerMonth: 917,
    annualTotal: 11000,
    annualSavings: 988,
    listingLabel: 'Unlimited',
    popular: false,
    features: [
      { label: 'Unlimited listings', included: true },
      { label: 'Exclusive newsletter blast', included: true },
      { label: 'Company spotlight', included: true },
      { label: 'Dedicated account manager', included: true },
      { label: 'Priority directory placement', included: true },
      { label: 'Early feature access', included: true },
      { label: 'All Pro features', included: true },
      { label: 'Priority support', included: true },
    ],
  },
]

function BillingToggle({ cycle, onChange }: { cycle: BillingCycle; onChange: (c: BillingCycle) => void }) {
  const isAnnual = cycle === 'annual'
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <div className="flex items-center p-1 rounded-pill" style={{ background: '#EDEDEE', gap: '2px' }}>
        <button
          type="button"
          onClick={() => onChange('monthly')}
          className="px-5 py-2 text-sm font-sans font-semibold rounded-pill transition-all duration-200"
          style={
            !isAnnual
              ? { background: '#FF6B35', color: '#FFFFFF', boxShadow: '0 2px 8px rgba(255,107,53,0.30)' }
              : { background: 'transparent', color: '#9A9DA2' }
          }
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => onChange('annual')}
          className="px-5 py-2 text-sm font-sans font-semibold rounded-pill transition-all duration-200"
          style={
            isAnnual
              ? { background: '#FF6B35', color: '#FFFFFF', boxShadow: '0 2px 8px rgba(255,107,53,0.30)' }
              : { background: 'transparent', color: '#9A9DA2' }
          }
        >
          Annual
        </button>
      </div>
      <span
        className="px-2.5 py-1 text-[10px] font-mono font-bold rounded-pill border"
        style={{ background: '#F0FFF0', color: '#1A5C18', borderColor: '#C8F5C4' }}
      >
        2 MONTHS FREE ON ANNUAL
      </span>
    </div>
  )
}

export default function PricingPageClient() {
  const router = useRouter()
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly')

  function handleChoosePaid(tierId: string) {
    router.push(`/dashboard/upgrade?tier=${tierId}&cycle=${billingCycle}`)
  }

  return (
    <div className="page-shell py-12 md:py-16">
      <div className="text-center mb-10">
        <p className="font-mono text-[11px] font-bold text-orange uppercase tracking-[0.12em] mb-3">
          MEMBERSHIP
        </p>
        <h1
          className="font-sans font-bold text-ink mb-3"
          style={{ fontSize: 'clamp(28px, 4vw, 40px)', letterSpacing: '-0.03em' }}
        >
          Plans built for equipment sellers
        </h1>
        <p className="font-sans text-ink-2 max-w-xl mx-auto" style={{ fontSize: '15px', lineHeight: 1.6 }}>
          From individual sellers to multi-location teams — list equipment, reach buyers, and grow on Black Diamond.
        </p>
      </div>

      <div className="flex justify-center mb-10">
        <BillingToggle cycle={billingCycle} onChange={setBillingCycle} />
      </div>

      <div
        className="grid gap-5 mb-8"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}
      >
        {/* Free */}
        <div
          className="bg-white rounded-[20px] flex flex-col"
          style={{ border: '1.5px solid #E8E9EA', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: '28px 24px 24px' }}
        >
          <p className="font-sans font-bold text-ink mb-4" style={{ fontSize: '22px', letterSpacing: '-0.02em' }}>
            Free
          </p>
          <div className="mb-1">
            <span className="font-mono font-bold text-ink" style={{ fontSize: '32px' }}>$0</span>
            <span className="font-mono text-ink-3 text-sm">/mo</span>
          </div>
          <p className="font-mono text-[12px] text-ink-3 mb-4">forever free</p>
          <span
            className="inline-flex items-center px-3 py-1 text-[12px] font-mono font-bold rounded-pill border mb-5 w-fit"
            style={{ background: '#F4F4F5', color: '#4A4D52', borderColor: '#E8E9EA' }}
          >
            3 listings
          </span>
          <div className="border-t border-[#F0F1F2] mb-5" />
          <ul className="space-y-3 mb-6 flex-1">
            {FREE_FEATURES.map(f => (
              <li key={f.label} className="flex items-start gap-2.5">
                <span className="shrink-0 font-bold text-sm" style={{ color: f.included ? '#FF6B35' : '#D4D5D7' }}>
                  {f.included ? '✓' : '✕'}
                </span>
                <span className="font-sans text-sm" style={{ color: f.included ? '#4A4D52' : '#B0B0B8' }}>{f.label}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/auth/signup"
            className="w-full py-3 text-sm font-bold rounded-pill text-center transition-colors border border-[#D4D5D7] text-ink hover:border-orange hover:text-orange"
          >
            Get started free
          </Link>
        </div>

        {PAID_TIERS.map(tier => {
          const price = billingCycle === 'monthly' ? tier.monthly : tier.annualPerMonth
          return (
            <div
              key={tier.id}
              className="bg-white rounded-[20px] flex flex-col relative"
              style={{
                border: tier.popular ? '1.5px solid #FFD4C2' : '1.5px solid #E8E9EA',
                boxShadow: tier.popular ? '0 4px 16px rgba(255,107,53,0.08)' : '0 2px 8px rgba(0,0,0,0.06)',
                padding: '28px 24px 24px',
              }}
            >
              {tier.popular && (
                <span
                  className="absolute px-3 py-1 text-[10px] font-mono font-bold rounded-pill text-white"
                  style={{ background: '#FF6B35', top: '20px', right: '20px' }}
                >
                  MOST POPULAR
                </span>
              )}
              <div className="flex items-center gap-2 mb-4">
                <p className="font-sans font-bold text-ink" style={{ fontSize: '22px', letterSpacing: '-0.02em' }}>
                  {tier.name}
                </p>
                <PlanDiamondMark plan={tier.id} />
              </div>
              <div className="mb-1">
                <span className="font-mono font-bold text-ink" style={{ fontSize: '32px' }}>${price.toLocaleString()}</span>
                <span className="font-mono text-ink-3 text-sm">/mo</span>
              </div>
              {billingCycle === 'annual' ? (
                <p className="font-mono text-[12px] text-ink-3 mb-4">
                  billed as ${tier.annualTotal.toLocaleString()}/yr · save ${tier.annualSavings}
                </p>
              ) : (
                <p className="font-mono text-[12px] text-ink-3 mb-4">billed monthly</p>
              )}
              <span
                className="inline-flex items-center px-3 py-1 text-[12px] font-mono font-bold rounded-pill border mb-5 w-fit"
                style={{ background: '#FFF2ED', color: '#FF6B35', borderColor: '#FFD4C2' }}
              >
                {tier.listingLabel}
              </span>
              <div className="border-t border-[#F0F1F2] mb-5" />
              <ul className="space-y-3 mb-6 flex-1">
                {tier.features.map(f => (
                  <li key={f.label} className="flex items-start gap-2.5">
                    <span className="shrink-0 font-bold text-sm" style={{ color: f.included ? '#FF6B35' : '#D4D5D7' }}>
                      {f.included ? '✓' : '✕'}
                    </span>
                    <span className="font-sans text-sm" style={{ color: f.included ? '#4A4D52' : '#B0B0B8' }}>{f.label}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => handleChoosePaid(tier.id)}
                className="w-full py-3 text-sm font-bold rounded-pill transition-colors border border-[#D4D5D7] text-ink hover:border-orange hover:text-orange"
              >
                Choose {tier.name}
              </button>
            </div>
          )
        })}
      </div>

      <EnterpriseTierBlock className="mt-0" />

      <p className="mt-10 text-center font-mono text-[11px] text-ink-3">
        Cancel anytime on individual plans · Secure payments via Stripe
      </p>
    </div>
  )
}
