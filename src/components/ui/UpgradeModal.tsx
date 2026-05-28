'use client'

import { useState, useEffect, useCallback } from 'react'
import type { MembershipPlan } from '@/lib/types/database'

// ─── Types ────────────────────────────────────────────────────────────────────

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  currentPlan?: MembershipPlan
}

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

// ─── Tier Card ────────────────────────────────────────────────────────────────

function TierCard({
  tier,
  billingCycle,
  onChoose,
}: {
  tier: TierConfig
  billingCycle: BillingCycle
  onChoose: (name: string) => void
}) {
  const price = billingCycle === 'monthly' ? tier.monthly : tier.annualPerMonth
  const isPopular = tier.popular

  return (
    <div
      className="bg-white rounded-[16px] flex flex-col relative"
      style={{
        border: isPopular ? '1.5px solid #FF6B35' : '1px solid #E8E9EA',
        boxShadow: isPopular ? '0 4px 24px rgba(255,107,53,0.18)' : '0 1px 4px rgba(0,0,0,0.05)',
        padding: '20px 16px 16px',
      }}
    >
      {/* Most Popular badge */}
      {isPopular && (
        <div className="flex justify-center mb-3">
          <span
            className="px-3 py-1 text-[10px] font-mono font-bold rounded-pill text-white"
            style={{ background: '#FF6B35' }}
          >
            MOST POPULAR
          </span>
        </div>
      )}

      {/* Icon + name */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl leading-none">{tier.icon}</span>
        <span className="font-sans font-bold text-ink" style={{ fontSize: '15px' }}>
          {tier.name}
        </span>
      </div>

      {/* Price */}
      <div className="mb-1">
        <span className="font-mono font-bold text-ink" style={{ fontSize: '24px', letterSpacing: '-0.02em' }}>
          ${price.toLocaleString()}
        </span>
        <span className="font-mono text-ink-3 text-sm">/mo</span>
      </div>

      {/* Annual note */}
      {billingCycle === 'annual' ? (
        <p className="font-mono text-[11px] text-ink-3 mb-3">
          billed as ${tier.annualTotal.toLocaleString()}/yr · save ${tier.annualSavings}
        </p>
      ) : (
        <p className="font-mono text-[11px] text-ink-3 mb-3">billed monthly</p>
      )}

      {/* Listings pill */}
      <div className="mb-4">
        <span
          className="inline-flex items-center px-2.5 py-1 text-[11px] font-mono font-bold rounded-pill border"
          style={{ background: '#FFF2ED', color: '#FF6B35', borderColor: '#FFD4C2' }}
        >
          {tier.listingLabel}
        </span>
      </div>

      {/* Divider */}
      <div className="border-t border-[#F0F1F2] mb-4" />

      {/* Feature list */}
      <ul className="space-y-2 mb-5 flex-1">
        {tier.features.map(f => (
          <li key={f.label} className="flex items-start gap-2">
            <span
              className="shrink-0 font-bold text-xs mt-0.5"
              style={{ color: f.included ? '#FF6B35' : '#D4D5D7' }}
            >
              {f.included ? '✓' : '✕'}
            </span>
            <span
              className="font-sans text-xs leading-snug"
              style={{ color: f.included ? '#4A4D52' : '#B0B0B8' }}
            >
              {f.label}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA button */}
      <button
        onClick={() => onChoose(tier.name)}
        className="w-full py-2.5 text-sm font-bold rounded-pill transition-all duration-150"
        style={
          isPopular
            ? { background: '#FF6B35', color: '#FFFFFF', boxShadow: '0 4px 16px rgba(255,107,53,0.30)' }
            : { background: '#FFFFFF', color: '#1A1D20', border: '1px solid #D4D5D7' }
        }
        onMouseEnter={e => {
          if (!isPopular) {
            const btn = e.currentTarget
            btn.style.borderColor = '#FF6B35'
            btn.style.color = '#FF6B35'
          }
        }}
        onMouseLeave={e => {
          if (!isPopular) {
            const btn = e.currentTarget
            btn.style.borderColor = '#D4D5D7'
            btn.style.color = '#1A1D20'
          }
        }}
      >
        Choose {tier.name}
      </button>
    </div>
  )
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function BillingToggle({
  cycle,
  onChange,
}: {
  cycle: BillingCycle
  onChange: (c: BillingCycle) => void
}) {
  const isAnnual = cycle === 'annual'

  return (
    <div className="flex items-center justify-center gap-3 py-4 px-6 bg-white border-b border-[#E8E9EA]">
      <span
        className="text-sm font-sans font-medium transition-colors"
        style={{ color: !isAnnual ? '#1A1D20' : '#9A9DA2' }}
      >
        Monthly
      </span>

      {/* Track */}
      <button
        onClick={() => onChange(isAnnual ? 'monthly' : 'annual')}
        className="relative shrink-0 transition-all"
        style={{
          width: 44,
          height: 24,
          borderRadius: '100px',
          background: '#FF6B35',
        }}
        aria-label="Toggle billing cycle"
      >
        {/* Thumb */}
        <span
          className="absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-200"
          style={{ transform: isAnnual ? 'translateX(23px)' : 'translateX(4px)' }}
        />
      </button>

      <span
        className="text-sm font-sans font-medium transition-colors"
        style={{ color: isAnnual ? '#1A1D20' : '#9A9DA2' }}
      >
        Annual
      </span>

      {/* Savings badge */}
      <span
        className="px-2.5 py-1 text-[10px] font-mono font-bold rounded-pill border"
        style={{
          background: '#F0FFF0',
          color: '#1A5C18',
          borderColor: '#C8F5C4',
        }}
      >
        SAVE UP TO $988/yr
      </span>
    </div>
  )
}

// ─── UpgradeModal ─────────────────────────────────────────────────────────────

export default function UpgradeModal({
  isOpen,
  onClose,
  title = "You've reached your free listing limit",
}: UpgradeModalProps) {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly')
  const [toast, setToast] = useState<string | null>(null)

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  // ESC key closes
  useEffect(() => {
    if (!isOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, handleClose])

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  function handleChoose(tierName: string) {
    setToast(`${tierName} plan — coming soon! Stripe will be connected in the next phase.`)
    setTimeout(() => setToast(null), 4000)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}
        onClick={handleClose}
      />

      {/* Modal card */}
      <div
        className="relative flex flex-col w-full overflow-hidden"
        style={{
          maxWidth: 640,
          maxHeight: '92vh',
          borderRadius: 24,
          background: '#F7F8F9',
          boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div
          className="bg-white border-b border-[#E8E9EA] shrink-0"
          style={{ padding: '24px 28px' }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p
                className="font-mono uppercase mb-1.5"
                style={{ fontSize: '10px', color: '#FF6B35', letterSpacing: '0.08em' }}
              >
                Upgrade your plan
              </p>
              <h2
                className="font-sans font-bold text-ink leading-tight mb-1"
                style={{ fontSize: '20px', letterSpacing: '-0.02em' }}
              >
                {title}
              </h2>
              <p className="font-sans text-ink-3" style={{ fontSize: '13px' }}>
                Upgrade to list more equipment and unlock premium features.
              </p>
            </div>

            {/* X close */}
            <button
              onClick={handleClose}
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-bg text-ink-3 hover:text-ink transition-colors mt-0.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Billing toggle ── */}
        <BillingToggle cycle={billingCycle} onChange={setBillingCycle} />

        {/* ── Cards grid (scrollable) ── */}
        <div className="overflow-y-auto flex-1" style={{ padding: 16 }}>
          <div className="grid grid-cols-3 gap-3">
            {TIERS.map(tier => (
              <TierCard
                key={tier.id}
                tier={tier}
                billingCycle={billingCycle}
                onChoose={handleChoose}
              />
            ))}
          </div>
        </div>

        {/* ── Footer ── */}
        <div
          className="bg-white border-t border-[#E8E9EA] shrink-0 flex items-center justify-between"
          style={{ padding: '14px 24px' }}
        >
          <p
            className="font-mono text-[11px]"
            style={{ color: '#B0B0B8', letterSpacing: '0.02em' }}
          >
            Cancel anytime · No contracts · Secure payments via Stripe
          </p>
          <button
            onClick={handleClose}
            className="text-sm font-sans font-medium text-ink-3 hover:text-ink transition-colors"
          >
            Maybe Later
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[110] pointer-events-none">
          <div
            className="flex items-center gap-2 bg-ink text-white text-sm font-sans px-5 py-3 rounded-pill"
            style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.25)' }}
          >
            <svg className="w-4 h-4 shrink-0 text-[#A2FF9A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {toast}
          </div>
        </div>
      )}
    </div>
  )
}
