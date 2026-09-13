import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import BDVerifiedBadge from '@/components/ui/BDVerifiedBadge'
import CompanyAvatar from '@/components/ui/CompanyAvatar'
import NewsletterSection from '@/components/NewsletterSection'
import SellerListingsSection from './SellerListingsSection'
import {
  loadPublicSellerListings,
  resolvePublicSellerBySlug,
} from '@/lib/sellers/publicSellerProfile'
import { canonicalUrl } from '@/lib/site'

interface Props {
  params: Promise<{ slug: string }>
}

export const dynamic = 'force-dynamic'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { global: { fetch: (url, opts = {}) => fetch(url, { ...opts, cache: 'no-store' }) } }
  )
}

function formatMemberSince(createdAt: string): string {
  return new Date(createdAt)
    .toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    .toUpperCase()
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const admin = getAdminClient()
  const profile = await resolvePublicSellerBySlug(admin, slug)

  if (!profile?.company_name) return { title: 'Seller Not Found' }

  const location = [profile.city, profile.state].filter(Boolean).join(', ')
  const description = location
    ? `Browse equipment listings from ${profile.company_name} on Black Diamond Marketplace — ${location}.`
    : `Browse equipment listings from ${profile.company_name} on Black Diamond Marketplace.`

  const canonical = canonicalUrl(`/sellers/${slug}`)

  return {
    title: profile.company_name,
    description,
    alternates: { canonical },
    openGraph: {
      title: profile.company_name,
      description,
      url: canonical,
      images: profile.company_logo_url ? [{ url: profile.company_logo_url }] : [],
      type: 'website',
    },
  }
}

export default async function SellerProfilePage({ params }: Props) {
  const { slug } = await params
  const admin = getAdminClient()

  const profile = await resolvePublicSellerBySlug(admin, slug)
  if (!profile) notFound()

  const { active: activeListings, sold: soldListings } = await loadPublicSellerListings(admin, profile)

  if (activeListings.length === 0) notFound()

  const activeCount = activeListings.length
  const soldCount = soldListings.length
  const locationText = [profile.city, profile.state].filter(Boolean).join(', ')
  const memberSince = formatMemberSince(profile.created_at)

  return (
    <div className="bg-bg min-h-screen pb-20">
      <div className="page-shell py-6">
        <div className="flex items-center gap-2 mb-6" style={{ fontSize: '12px' }}>
          <Link href="/sellers" className="text-ink-3 hover:text-ink transition-colors font-sans">
            Business Directory
          </Link>
          <span className="text-ink-3">/</span>
          <span className="text-ink font-sans font-medium truncate max-w-[300px]">
            {profile.company_name ?? slug}
          </span>
        </div>

        <div
          className="bg-white border border-[#E8E9EA] rounded-[20px] mb-6"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)', padding: '28px 32px' }}
        >
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="flex items-center gap-5 min-w-0">
              <CompanyAvatar
                logoUrl={profile.company_logo_url}
                companyName={profile.company_name}
                size={112}
              />

              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <h1
                    className="font-sans font-bold text-ink leading-tight"
                    style={{ fontSize: '22px', letterSpacing: '-0.02em' }}
                  >
                    {profile.company_name ?? 'Unknown Company'}
                  </h1>
                  <BDVerifiedBadge plan={profile.plan} size="md" />
                </div>

                {locationText && (
                  <p className="font-sans mb-1.5" style={{ fontSize: '13px', color: '#9A9DA2' }}>
                    {locationText}
                  </p>
                )}

                {profile.description && (
                  <p className="font-sans mb-1.5 max-w-2xl" style={{ fontSize: '13px', color: '#5C5F66' }}>
                    {profile.description}
                  </p>
                )}

                <p
                  className="font-mono uppercase"
                  style={{ fontSize: '11px', color: '#B0B0B8', letterSpacing: '0.06em' }}
                >
                  MEMBER SINCE {memberSince}
                </p>
              </div>
            </div>
          </div>

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

        <SellerListingsSection
          activeListings={activeListings}
          soldListings={soldListings}
        />

        <NewsletterSection source="seller_profile" className="!pb-0" />
      </div>
    </div>
  )
}
