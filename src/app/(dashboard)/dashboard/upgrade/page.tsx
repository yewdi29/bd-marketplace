'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { MembershipPlan } from '@/lib/types/database'

// ─── Types ────────────────────────────────────────────────────────────────────

type BillingCycle = 'monthly' | 'annual'

interface TierFeature {
  label: string
  included: boolean
}

interface TierConfig {
  id: 'starter' | 'pro' | 'max'
  icon: string
  name: string
  monthly: number
  annualPerMonth: number
  annualTotal: number
  annualSavings: number
  listingLabel: string
  popular: boolean
  features: TierFeature[]
}

// ─── Tier config ──────────────────────────────────────────────────────────────

const TIERS: TierConfig[] = [
  {
    id: 'starter',
    icon: '🥉',
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
    icon: '🥈',
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
    icon: '🏆',
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

// ─── Billing Toggle ───────────────────────────────────────────────────────────

function BillingToggle({
  cycle,
  onChange,
}: {
  cycle: BillingCycle
  onChange: (c: BillingCycle) => void
}) {
  const isAnnual = cycle === 'annual'
  return (
    <div className="flex items-center justify-center gap-3">
      {/* Segmented pill control */}
      <div
        className="flex items-center p-1 rounded-pill"
        style={{ background: '#EDEDEE', gap: '2px' }}
      >
        <button
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

      {/* Savings badge */}
      <span
        className="px-2.5 py-1 text-[10px] font-mono font-bold rounded-pill border"
        style={{ background: '#F0FFF0', color: '#1A5C18', borderColor: '#C8F5C4' }}
      >
        SAVE UP TO $988/yr
      </span>
    </div>
  )
}

// ─── Tier Card ────────────────────────────────────────────────────────────────

function TierCard({
  tier,
  billingCycle,
  currentPlan,
  onChoose,
  loading,
  onManageMembership,
  portalLoading,
}: {
  tier: TierConfig
  billingCycle: BillingCycle
  currentPlan: MembershipPlan
  onChoose: (id: string) => void
  loading: boolean
  onManageMembership: () => void
  portalLoading: boolean
}) {
  const price = billingCycle === 'monthly' ? tier.monthly : tier.annualPerMonth
  const isPopular = tier.popular
  const isCurrent = tier.id === currentPlan

  return (
    <div
      className="bg-white rounded-[20px] flex flex-col relative"
      style={{
        border: isPopular ? '1.5px solid #FFD4C2' : '1.5px solid #E8E9EA',
        boxShadow: isPopular
          ? '0 4px 16px rgba(255,107,53,0.08)'
          : '0 2px 8px rgba(0,0,0,0.06)',
        padding: '28px 24px 24px',
      }}
    >
      {/* Corner badge — Current Plan takes priority over Most Popular, absolutely positioned, no layout impact */}
      {isCurrent ? (
        <span
          className="absolute px-3 py-1 text-[10px] font-mono font-bold rounded-pill"
          style={{ background: '#FFFFFF', color: '#1A1D20', border: '1.5px solid #D4D5D7', top: '20px', right: '20px', zIndex: 10 }}
        >
          CURRENT PLAN
        </span>
      ) : isPopular && (
        <span
          className="absolute px-3 py-1 text-[10px] font-mono font-bold rounded-pill text-white"
          style={{ background: '#FF6B35', top: '20px', right: '20px', zIndex: 10 }}
        >
          MOST POPULAR
        </span>
      )}

      {/* Name */}
      <div className="flex items-center gap-2 mb-4">
        <span className="font-sans font-bold text-ink" style={{ fontSize: '22px', letterSpacing: '-0.02em' }}>
          {tier.name}
        </span>
      </div>

      {/* Price */}
      <div className="mb-1">
        <span className="font-mono font-bold text-ink" style={{ fontSize: '32px', letterSpacing: '-0.03em' }}>
          ${price.toLocaleString()}
        </span>
        <span className="font-mono text-ink-3 text-sm">/mo</span>
      </div>

      {/* Annual note */}
      {billingCycle === 'annual' ? (
        <p className="font-mono text-[12px] text-ink-3 mb-4">
          billed as ${tier.annualTotal.toLocaleString()}/yr · save ${tier.annualSavings}
        </p>
      ) : (
        <p className="font-mono text-[12px] text-ink-3 mb-4">billed monthly</p>
      )}

      {/* Listings pill */}
      <div className="mb-5">
        <span
          className="inline-flex items-center px-3 py-1 text-[12px] font-mono font-bold rounded-pill border"
          style={{ background: '#FFF2ED', color: '#FF6B35', borderColor: '#FFD4C2' }}
        >
          {tier.listingLabel}
        </span>
      </div>

      {/* Divider */}
      <div className="border-t border-[#F0F1F2] mb-5" />

      {/* Feature list */}
      <ul className="space-y-3 mb-6 flex-1">
        {tier.features.map(f => (
          <li key={f.label} className="flex items-start gap-2.5">
            <span
              className="shrink-0 font-bold text-sm mt-0.5"
              style={{ color: f.included ? '#FF6B35' : '#D4D5D7' }}
            >
              {f.included ? '✓' : '✕'}
            </span>
            <span
              className="font-sans text-sm leading-snug"
              style={{ color: f.included ? '#4A4D52' : '#B0B0B8' }}
            >
              {f.label}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      {isCurrent ? (
        <button
          onClick={onManageMembership}
          disabled={portalLoading}
          className="w-full py-3 text-sm font-bold rounded-pill transition-all duration-150 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{ background: '#FFFFFF', color: '#1A1D20', border: '1.5px solid #D4D5D7' }}
          onMouseEnter={e => {
            if (!portalLoading) {
              e.currentTarget.style.borderColor = '#FF6B35'
              e.currentTarget.style.color = '#FF6B35'
            }
          }}
          onMouseLeave={e => {
            if (!portalLoading) {
              e.currentTarget.style.borderColor = '#D4D5D7'
              e.currentTarget.style.color = '#1A1D20'
            }
          }}
        >
          {portalLoading ? (
            <svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          ) : 'Manage Membership'}
        </button>
      ) : (
        <button
          onClick={() => onChoose(tier.id)}
          disabled={isCurrent || loading}
          className="w-full py-3 text-sm font-bold rounded-pill transition-all duration-150 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={
            isCurrent
              ? { background: '#F4F4F5', color: '#9A9DA2', border: '1px solid #E4E4E7' }
              : { background: '#FFFFFF', color: '#1A1D20', border: '1.5px solid #D4D5D7' }
          }
          onMouseEnter={e => {
            if (!isCurrent && !loading) {
              e.currentTarget.style.borderColor = '#FF6B35'
              e.currentTarget.style.color = '#FF6B35'
            }
          }}
          onMouseLeave={e => {
            if (!isCurrent && !loading) {
              e.currentTarget.style.borderColor = '#D4D5D7'
              e.currentTarget.style.color = '#1A1D20'
            }
          }}
        >
          {loading ? (
            <svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          ) : isCurrent ? 'Current Plan' : `Choose ${tier.name}`}
        </button>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UpgradePage() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly')
  const [currentPlan, setCurrentPlan] = useState<MembershipPlan>('free')
  const [loadingTier, setLoadingTier] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadPlan() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('users').select('plan').eq('id', user.id).single()
      if (data?.plan) setCurrentPlan(data.plan as MembershipPlan)
    }
    loadPlan()
  }, [supabase])

  async function handleChoose(tierId: string) {
    setError(null)
    setLoadingTier(tierId)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tierId, billingPeriod: billingCycle }),
      })
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok || !data.url) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        setLoadingTier(null)
        return
      }
      window.location.href = data.url
    } catch {
      setError('Network error. Please check your connection and try again.')
      setLoadingTier(null)
    }
  }

  async function handleManageMembership() {
    setError(null)
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok || !data.url) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        setPortalLoading(false)
        return
      }
      window.location.href = data.url
    } catch {
      setError('Network error. Please check your connection and try again.')
      setPortalLoading(false)
    }
  }

  return (
    <div className="max-w-[1450px] mx-auto px-6 py-8">

      {/* ── Header ── */}
      <div className="mb-2">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-1.5 text-sm font-sans text-ink-3 hover:text-ink transition-colors mb-6"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <h1
          className="font-sans font-bold text-ink mb-2 text-center"
          style={{ fontSize: '28px', letterSpacing: '-0.02em' }}
        >
          Upgrade Your Plan
        </h1>
        <p className="font-sans text-ink-3 text-center" style={{ fontSize: '15px' }}>
          List more equipment, unlock premium features, and grow your business on Black Diamond.
        </p>
      </div>

      {/* ── Billing Toggle ── */}
      <div className="flex justify-center py-8">
        <BillingToggle cycle={billingCycle} onChange={setBillingCycle} />
      </div>

      {/* ── Tier Cards ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '20px',
        }}
      >
        {TIERS.map(tier => (
          <TierCard
            key={tier.id}
            tier={tier}
            billingCycle={billingCycle}
            currentPlan={currentPlan}
            onChoose={handleChoose}
            loading={loadingTier === tier.id}
            onManageMembership={handleManageMembership}
            portalLoading={portalLoading}
          />
        ))}
      </div>

      {/* ── Footer note ── */}
      <div className="mt-10 flex items-center justify-center">
        <p
          className="font-mono text-[11px] text-center"
          style={{ color: '#B0B0B8', letterSpacing: '0.02em' }}
        >
          Cancel anytime · No contracts · Secure payments via Stripe
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mt-6 max-w-lg mx-auto px-4 py-3 rounded-[10px] border border-red-200 bg-red-50">
          <p className="text-sm font-sans text-red-600 text-center">{error}</p>
        </div>
      )}
    </div>
  )
}
