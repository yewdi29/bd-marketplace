import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import BDVerifiedBadge from '@/components/ui/BDVerifiedBadge'
import BusinessDirectoryGate from '@/components/sellers/BusinessDirectoryGate'
import { getDirectoryAccess } from '@/lib/directoryAccess'
import { loadDirectorySellerEntries, type DirectorySellerEntry } from '@/lib/sellers/directoryEntries'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Business Directory',
  description: 'Browse verified equipment sellers on Black Diamond Marketplace — oil and gas equipment dealers, rental companies, and rig operators.',
}

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { global: { fetch: (url, opts = {}) => fetch(url, { ...opts, cache: 'no-store' }) } }
  )
}

function getInitials(name: string | null): string {
  if (!name) return '?'
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('')
}

function SellerCard({ seller }: { seller: DirectorySellerEntry }) {
  const locationText = [seller.city, seller.state].filter(Boolean).join(', ')
  const initials = getInitials(seller.company_name)

  return (
    <Link
      href={`/sellers/${seller.company_slug}`}
      className="group block bg-white border border-[#E8E9EA] rounded-[16px] p-5 hover:-translate-y-0.5 transition-all"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
    >
      <div className="flex items-center gap-4 mb-4">
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

export default async function SellersDirectoryPage() {
  const access = await getDirectoryAccess()
  if (!access.allowed) {
    return <BusinessDirectoryGate signedIn={access.signedIn} />
  }

  const admin = getAdminClient()
  const sellerRows = await loadDirectorySellerEntries(admin)
  const totalListings = sellerRows.reduce((sum, row) => sum + row.active_count, 0)

  return (
    <div className="bg-bg min-h-screen pb-20">
      <div className="page-shell py-8">
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
              <SellerCard key={`${seller.kind}-${seller.id}`} seller={seller} />
            ))}
          </div>
        )}

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
