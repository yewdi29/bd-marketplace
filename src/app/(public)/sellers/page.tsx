import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
import type { MembershipPlan } from '@/lib/types/database'
import BDVerifiedBadge from '@/components/ui/BDVerifiedBadge'

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'Business Directory | Black Diamond Marketplace',
  description: 'Browse verified equipment sellers on Black Diamond Marketplace — oil and gas equipment dealers, rental companies, and rig operators.',
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface SellerRow {
  id: string
  company_name: string | null
  company_logo_url: string | null
  company_slug: string | null
  city: string | null
  state: string | null
  plan: MembershipPlan
  active_count: number
}

// ─── Admin client ─────────────────────────────────────────────────────────────

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { global: { fetch: (url, opts = {}) => fetch(url, { ...opts, cache: 'no-store' }) } }
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string | null): string {
  if (!name) return '?'
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('')
}

// ─── Seller Card ──────────────────────────────────────────────────────────────

function SellerCard({ seller }: { seller: SellerRow }) {
  const locationText = [seller.city, seller.state].filter(Boolean).join(', ')
  const initials = getInitials(seller.company_name)

  return (
    <Link
      href={`/sellers/${seller.company_slug}`}
      className="group block bg-white border border-[#E8E9EA] rounded-[16px] p-5 hover:-translate-y-0.5 transition-all"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
    >
      <div className="flex items-center gap-4 mb-4">
        {/* Logo / initials */}
        {seller.company_logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={seller.company_logo_url}
            alt={seller.company_name ?? 'Company logo'}
            className="block shrink-0"
            style={{ maxHeight: 64, width: 'auto', height: 'auto' }}
          />
        ) : (
          <div
            className="flex items-center justify-center shrink-0"
            style={{ width: 64, height: 64, borderRadius: '12px', background: '#1A1D20' }}
          >
            <span className="font-sans font-bold text-base text-white select-none leading-none">
              {initials}
            </span>
          </div>
        )}

        {/* Name + badge */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
            <p
              className="font-sans font-bold text-ink group-hover:text-orange transition-colors truncate"
              style={{ fontSize: '14px', letterSpacing: '-0.01em' }}
            >
              {seller.company_name ?? 'Unknown Company'}
            </p>
            <BDVerifiedBadge plan={seller.plan} size="sm" />
          </div>

          {locationText && (
            <p className="font-sans text-ink-3 truncate" style={{ fontSize: '12px' }}>
              {locationText}
            </p>
          )}
        </div>
      </div>

      {/* Active listing count */}
      <div
        className="flex items-center justify-between pt-3"
        style={{ borderTop: '1px solid #F0F1F2' }}
      >
        <p className="font-mono text-ink-3" style={{ fontSize: '11px' }}>
          Active listings
        </p>
        <p className="font-mono font-bold text-ink" style={{ fontSize: '13px' }}>
          {seller.active_count}
        </p>
      </div>
    </Link>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SellersDirectoryPage() {
  const admin = getAdminClient()

  // Fetch all users who have at least one active listing and a company_slug
  // We join via a subquery-style approach: get sellers with active listings
  const { data: sellers } = await admin
    .from('users')
    .select('id, company_name, company_logo_url, company_slug, city, state, plan')
    .not('company_slug', 'is', null)
    .not('company_name', 'is', null)
    .order('company_name', { ascending: true })

  if (!sellers || sellers.length === 0) {
    return (
      <div className="bg-bg min-h-screen pb-20">
        <div className="max-w-[1450px] mx-auto px-8 py-12 text-center">
          <p className="font-sans text-ink-3">No sellers found.</p>
        </div>
      </div>
    )
  }

  // Fetch active listing counts for each seller in one query
  const { data: listingCounts } = await admin
    .from('listings')
    .select('seller_id')
    .eq('status', 'active')
    .in('seller_id', sellers.map(s => s.id))

  const countMap: Record<string, number> = {}
  for (const row of listingCounts ?? []) {
    countMap[row.seller_id] = (countMap[row.seller_id] ?? 0) + 1
  }

  // Priority map — max first, free last. premium kept for legacy rows.
  const planPriority: Record<string, number> = {
    max: 1,
    pro: 2,
    premium: 2, // legacy
    starter: 3,
    free: 4,
  }

  // Filter to sellers who have at least 1 active listing, then sort by tier → active count
  const sellerRows: SellerRow[] = sellers
    .filter(s => (countMap[s.id] ?? 0) > 0 && s.company_slug)
    .map(s => ({
      id: s.id,
      company_name: s.company_name,
      company_logo_url: s.company_logo_url,
      company_slug: s.company_slug,
      city: s.city,
      state: s.state,
      plan: s.plan as MembershipPlan,
      active_count: countMap[s.id] ?? 0,
    }))
    .sort((a, b) => {
      const tierDiff = (planPriority[a.plan] ?? 4) - (planPriority[b.plan] ?? 4)
      if (tierDiff !== 0) return tierDiff
      return b.active_count - a.active_count
    })

  const totalListings = Object.values(countMap).reduce((s, n) => s + n, 0)

  return (
    <div className="bg-bg min-h-screen pb-20">
      <div className="max-w-[1450px] mx-auto px-8 py-8">

        {/* ── Page header ── */}
        <div className="mb-8">
          <p
            className="font-mono uppercase text-ink-3 mb-2"
            style={{ fontSize: '11px', letterSpacing: '0.08em' }}
          >
            Black Diamond Marketplace
          </p>
          <h1
            className="font-sans font-bold text-ink mb-2"
            style={{ fontSize: '28px', letterSpacing: '-0.02em' }}
          >
            Business Directory
          </h1>
          <p className="font-sans text-ink-3" style={{ fontSize: '14px' }}>
            {sellerRows.length} verified seller{sellerRows.length !== 1 ? 's' : ''} · {totalListings} active listing{totalListings !== 1 ? 's' : ''}
          </p>
        </div>

        {/* ── Grid ── */}
        {sellerRows.length === 0 ? (
          <div
            className="bg-white border border-[#E8E9EA] rounded-[16px] py-20 text-center"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
          >
            <p className="font-sans text-ink-3 text-sm">No sellers with active listings yet.</p>
            <Link
              href="/search"
              className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-orange hover:text-orange-lt transition-colors"
            >
              Browse all listings
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sellerRows.map(seller => (
              <SellerCard key={seller.id} seller={seller} />
            ))}
          </div>
        )}

        {/* ── CTA: Browse listings ── */}
        <div className="mt-10 text-center">
          <Link
            href="/search"
            className="inline-flex items-center gap-2 text-sm font-semibold text-orange hover:text-orange-lt transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Browse all equipment
          </Link>
        </div>

      </div>
    </div>
  )
}
