import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import type { Listing, MembershipPlan } from '@/lib/types/database'
import BDVerifiedBadge from '@/components/ui/BDVerifiedBadge'
import NewsletterForm from '@/components/NewsletterForm'
import SellerContactModal from './SellerContactModal'
import SellerListingsSection from './SellerListingsSection'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SellerProfile {
  id: string
  company_name: string | null
  company_logo_url: string | null
  company_slug: string | null
  city: string | null
  state: string | null
  country: string | null
  plan: MembershipPlan
  created_at: string
}

interface Props {
  params: Promise<{ slug: string }>
}

// ─── Admin client (server-side only) ─────────────────────────────────────────

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMemberSince(createdAt: string): string {
  return new Date(createdAt)
    .toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    .toUpperCase()
}

function getInitials(companyName: string | null): string {
  if (!companyName) return '?'
  return companyName
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('')
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const admin = getAdminClient()
  const { data } = await admin
    .from('users')
    .select('company_name, city, state, company_logo_url')
    .eq('company_slug', slug)
    .maybeSingle()

  if (!data?.company_name) return { title: 'Seller Not Found | Black Diamond Marketplace' }

  const location = [data.city, data.state].filter(Boolean).join(', ')
  const description = location
    ? `Browse equipment listings from ${data.company_name} on Black Diamond Marketplace — ${location}.`
    : `Browse equipment listings from ${data.company_name} on Black Diamond Marketplace.`

  return {
    title: `${data.company_name} | Black Diamond Marketplace`,
    description,
    openGraph: {
      title: data.company_name,
      description,
      images: data.company_logo_url ? [{ url: data.company_logo_url }] : [],
      type: 'website',
    },
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SellerProfilePage({ params }: Props) {
  const { slug } = await params
  const admin = getAdminClient()

  // Fetch seller by company_slug — never expose user ID in the URL
  const { data: seller } = await admin
    .from('users')
    .select('id, company_name, company_logo_url, company_slug, city, state, country, plan, created_at')
    .eq('company_slug', slug)
    .maybeSingle()

  if (!seller) notFound()

  const profile = seller as SellerProfile

  // Fetch active and sold listings in parallel
  const [{ data: activeListings }, { data: soldListings }] = await Promise.all([
    admin
      .from('listings')
      .select('*, listing_images(*)')
      .eq('seller_id', profile.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false }),
    admin
      .from('listings')
      .select('*, listing_images(*)')
      .eq('seller_id', profile.id)
      .eq('status', 'sold')
      .order('updated_at', { ascending: false }),
  ])

  // Require at least one active listing to show the profile publicly
  if (!activeListings || activeListings.length === 0) notFound()

  const activeCount = activeListings.length
  const soldCount = soldListings?.length ?? 0
  const locationText = [profile.city, profile.state].filter(Boolean).join(', ')
  const initials = getInitials(profile.company_name)
  const memberSince = formatMemberSince(profile.created_at)

  return (
    <div className="bg-bg min-h-screen pb-20">
      <div className="max-w-[1200px] mx-auto px-8 py-6">

        {/* ── Breadcrumb ── */}
        <div className="flex items-center gap-2 mb-6" style={{ fontSize: '12px' }}>
          <Link href="/sellers" className="text-ink-3 hover:text-ink transition-colors font-sans">
            Business Directory
          </Link>
          <span className="text-ink-3">/</span>
          <span className="text-ink font-sans font-medium truncate max-w-[300px]">
            {profile.company_name ?? slug}
          </span>
        </div>

        {/* ── Profile header card ── */}
        <div
          className="bg-white border border-[#E8E9EA] rounded-[20px] mb-6"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)', padding: '28px 32px' }}
        >
          <div className="flex items-start justify-between gap-6 flex-wrap">

            {/* Left: logo + info */}
            <div className="flex items-center gap-5 min-w-0">
              {/* 72px circular logo / initials */}
              <div
                className="w-[72px] h-[72px] rounded-full overflow-hidden bg-ink flex items-center justify-center shrink-0"
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.10)' }}
              >
                {profile.company_logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.company_logo_url}
                    alt={profile.company_name ?? 'Company logo'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-sans font-bold text-2xl text-white select-none">{initials}</span>
                )}
              </div>

              {/* Info */}
              <div className="min-w-0">
                {/* Company name + BD Verified badge */}
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <h1
                    className="font-sans font-bold text-ink leading-tight"
                    style={{ fontSize: '22px', letterSpacing: '-0.02em' }}
                  >
                    {profile.company_name ?? 'Unknown Company'}
                  </h1>
                  <BDVerifiedBadge plan={profile.plan} size="md" />
                </div>

                {/* Location */}
                {locationText && (
                  <p className="font-sans mb-1.5" style={{ fontSize: '13px', color: '#9A9DA2' }}>
                    {locationText}
                  </p>
                )}

                {/* Member since */}
                <p
                  className="font-mono uppercase"
                  style={{ fontSize: '11px', color: '#B0B0B8', letterSpacing: '0.06em' }}
                >
                  MEMBER SINCE {memberSince}
                </p>
              </div>
            </div>

            {/* Right: Send Message button */}
            <div className="shrink-0 pt-1">
              <SellerContactModal
                sellerId={profile.id}
                sellerName={profile.company_name ?? 'this seller'}
              />
            </div>
          </div>

          {/* Stats strip */}
          <div className="flex items-center gap-8 mt-6 pt-5 border-t border-[#F0F1F2]">
            <div>
              <p className="font-mono font-bold text-ink" style={{ fontSize: '20px' }}>{activeCount}</p>
              <p className="font-sans text-ink-3 mt-0.5" style={{ fontSize: '12px' }}>Active Listings</p>
            </div>
            {soldCount > 0 && (
              <div>
                <p className="font-mono font-bold text-ink" style={{ fontSize: '20px' }}>{soldCount}</p>
                <p className="font-sans text-ink-3 mt-0.5" style={{ fontSize: '12px' }}>Previously Sold</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Listings section (client — tabs, sort, pagination) ── */}
        <SellerListingsSection
          activeListings={activeListings as Listing[]}
          soldListings={(soldListings ?? []) as Listing[]}
        />

        {/* ── Newsletter section ── */}
        <div
          className="bg-white border border-[#E8E9EA] rounded-[20px] mt-10 text-center"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)', padding: '40px 48px' }}
        >
          <p
            className="font-sans font-bold text-ink mb-2"
            style={{ fontSize: '20px', letterSpacing: '-0.02em' }}
          >
            Stay in the Loop
          </p>
          <p className="font-sans text-ink-3 mb-6" style={{ fontSize: '14px' }}>
            Get notified when new equipment is listed on Black Diamond Marketplace.
          </p>
          <div className="max-w-sm mx-auto">
            <NewsletterForm source="seller_profile" />
          </div>
        </div>

      </div>
    </div>
  )
}
