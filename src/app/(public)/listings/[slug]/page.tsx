import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import type { Listing, MembershipPlan } from '@/lib/types/database'
import { formatPrice } from '@/lib/formatPrice'
import PhotoGallery from './PhotoGallery'
import ListingActions from './ListingActions'
import InquiryForm from './InquiryForm'
import ListingBreadcrumb from './ListingBreadcrumb'
import ListingCard from '@/components/ListingCard'
import ListingCardGrid from '@/components/listings/ListingCardGrid'
import ListingLocationPill from '@/components/listings/ListingLocationPill'
import BDVerifiedBadge from '@/components/ui/BDVerifiedBadge'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  drilling_rig: 'Drilling Rig',
  drill_pipe: 'Drill Pipe',
  drill_collar: 'Drill Collar',
  blowout_preventer: 'Blowout Preventer (BOP)',
  wellhead: 'Wellhead Equipment',
  pumping_unit: 'Pumping Unit',
  artificial_lift: 'Artificial Lift',
  wireline: 'Wireline Equipment',
  coiled_tubing: 'Coiled Tubing',
  completion_equipment: 'Completion Equipment',
  production_equipment: 'Production Equipment',
  compressor: 'Compressor',
  separator: 'Separator',
  tank: 'Tank',
  flowline: 'Flowline & Piping',
  electrical: 'Electrical Equipment',
  safety: 'Safety Equipment',
  rental_tools: 'Rental Tools',
  rig: 'Drilling Rig',
  mud_pump: 'Mud Pump',
  other: 'Other',
}

const CONDITION_LABELS: Record<string, string> = {
  new: 'New',
  like_new: 'Like New',
  good: 'Good',
  fair: 'Fair',
  parts_only: 'Parts Only',
}

function catLabel(val: string) {
  return CATEGORY_LABELS[val] ?? val.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function listingCategorySearchHref(listing: {
  category: string
  categories?: { slug: string } | null
}): string {
  if (listing.categories?.slug) {
    return `/search?cat=${encodeURIComponent(listing.categories.slug)}`
  }
  return `/search?category=${encodeURIComponent(listing.category)}`
}

function condLabel(val: string) {
  return CONDITION_LABELS[val] ?? val.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('listings')
    .select('title, price, price_unit, price_visible, location_city, location_state, listing_images(url, sort_order)')
    .eq('slug', slug)
    .eq('status', 'active')
    .single()

  if (!data) return { title: 'Listing Not Found' }

  const canonicalUrl = `https://blackdiamondmkt.com/listings/${slug}`

  const imgs = (data.listing_images ?? []) as { url: string; sort_order: number }[]
  const firstImg = [...imgs].sort((a, b) => a.sort_order - b.sort_order)[0]
  const ogImage = firstImg?.url

  const location = [data.location_city, data.location_state].filter(Boolean).join(', ')
  const priceDisplay = formatPrice(data.price, data.price_unit ?? 'total', data.price_visible !== false)
  const description = `${data.title} available on Black Diamond Marketplace.${location ? ` Located in ${location}.` : ''} ${priceDisplay}.`

  return {
    title: `${data.title} | Black Diamond Marketplace`,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: data.title,
      description,
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
      url: canonicalUrl,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: data.title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ListingDetailPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  // Fetch listing + images
  const { data: listing } = await supabase
    .from('listings')
    .select('*, listing_images(*), countries(name, iso_code), categories(slug, name)')
    .eq('slug', slug)
    .single()

  if (!listing || listing.status !== 'active') notFound()

  const l = listing as Listing & {
    price_visible?: boolean
    countries?: { name: string; iso_code: string } | null
    categories?: { slug: string; name: string } | null
  }

  // Fetch seller profile — service role for users table access.
  // Only safe, non-PII fields selected.
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { global: { fetch: (url, opts = {}) => fetch(url, { ...opts, cache: 'no-store' }) } }
  )
  const { data: sellerData } = await adminClient
    .from('users')
    .select('company_name, company_logo_url, company_slug, plan, created_at')
    .eq('id', l.seller_id)
    .maybeSingle()

  const seller = sellerData as {
    company_name: string | null
    company_logo_url: string | null
    company_slug: string | null
    plan: MembershipPlan
    created_at: string
  } | null

  // Lazy-generate company_slug for sellers who pre-date the migration.
  // Runs once; after writing, the slug is stored and this branch is skipped.
  if (seller && seller.company_name && !seller.company_slug) {
    const base = seller.company_name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    if (base) {
      const { data: conflict } = await adminClient
        .from('users')
        .select('id')
        .eq('company_slug', base)
        .neq('id', l.seller_id)
        .maybeSingle()

      const slug = conflict
        ? `${base}-${Math.random().toString(36).slice(2, 6)}`
        : base

      await adminClient
        .from('users')
        .update({ company_slug: slug, updated_at: new Date().toISOString() })
        .eq('id', l.seller_id)

      seller.company_slug = slug
    }
  }

  // Related listings (same category, limit 3)
  const { data: related } = await supabase
    .from('listings')
    .select('*, listing_images(*), countries(name, iso_code)')
    .eq('category', l.category)
    .eq('status', 'active')
    .neq('id', l.id)
    .order('created_at', { ascending: false })
    .limit(3)

  // Current user — needed for ListingCard isLoggedIn prop
  const { data: { user } } = await supabase.auth.getUser()

  // Check whether the current user has already saved this listing
  let initialSaved = false
  if (user) {
    const { data: savedRow } = await supabase
      .from('saved_listings')
      .select('id')
      .eq('user_id', user.id)
      .eq('listing_id', l.id)
      .maybeSingle()
    initialSaved = !!savedRow
  }

  // Sort images: primary first, then by sort_order
  const images = (l.listing_images ?? []).sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1
    if (!a.is_primary && b.is_primary) return 1
    return a.sort_order - b.sort_order
  })

  const priceVisible = l.price_visible !== false

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const listingUrl = `${appUrl}/listings/${slug}`
  const listingLocation = [l.location_city, l.location_state, l.countries?.name].filter(Boolean).join(', ') || null
  const hasLocationPill = Boolean(l.location_city || l.location_state || l.countries?.name)

  const categoryDisplayLabel = l.categories?.name ?? catLabel(l.category)
  const categorySearchHref = listingCategorySearchHref(l)

  // Build specs array — structured fields first, then dynamic AI specs
  const aiSpecs: { label: string; value: string | number }[] = l.specs
    ? Object.entries(l.specs)
        .filter(([, v]) => v != null && String(v).trim() !== '')
        .map(([k, v]) => ({ label: k, value: String(v) }))
    : []

  const specs: { label: string; value: string | number }[] = [
    l.year        ? { label: 'Year',        value: l.year }                                                   : null,
    l.manufacturer? { label: 'Manufacturer', value: l.manufacturer }                                          : null,
    l.model       ? { label: 'Model',        value: l.model }                                                  : null,
    l.condition   ? { label: 'Condition',    value: condLabel(l.condition) }                                   : null,
    { label: 'Category', value: catLabel(l.category) },
    ...aiSpecs,
  ].filter((s): s is { label: string; value: string | number } => s !== null)

  // JSON-LD Product schema
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: l.title,
    description: l.description ?? undefined,
    offers: {
      '@type': 'Offer',
      price: l.price,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="bg-bg min-h-screen pb-20">
        <div className="page-shell">

        {/* Breadcrumb (desktop) / Back button (mobile, tablet) */}
        <ListingBreadcrumb category={l.category} categoryLabel={catLabel(l.category)} title={l.title} />

        {/* ── Two-column grid — gallery fills remaining space, info column fluid between 450–550px ── */}
        <div
          className="grid grid-cols-1 lg:grid-cols-[1fr_clamp(500px,30vw,600px)] lg:items-start pb-8"
          style={{ gap: '24px' }}
        >

          {/* ── Left column: sticky photo gallery (desktop only) ── */}
          <div className="lg:sticky lg:top-20 lg:self-start lg:z-10">
            <div
              className="bg-white border border-[#E8E9EA] rounded-[16px] overflow-hidden"
              style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
            >
              <PhotoGallery
                images={images}
                title={l.title}
                shareUrl={listingUrl}
                shareTitle={l.title}
                actions={
                  <ListingActions
                    listingId={l.id}
                    initialSaved={initialSaved}
                    isLoggedIn={!!user}
                    listingTitle={l.title}
                    listingPrice={formatPrice(l.price, l.price_unit ?? 'total', priceVisible)}
                    listingLocation={listingLocation}
                    listingUrl={listingUrl}
                  />
                }
              />
            </div>
          </div>

          {/* ── Right column: all details, scrolls normally ── */}
          <div
            className="flex flex-col min-w-0 w-full lg:min-w-[500px] lg:max-w-[600px] bg-white border border-[#E8E9EA] rounded-[16px]"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)', padding: '24px' }}
          >

            {/* Category label */}
            <Link
              href={categorySearchHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block font-mono uppercase text-ink-3 hover:text-orange transition-colors mb-2 underline-offset-2 hover:underline"
              style={{ fontSize: '11px', letterSpacing: '0.08em' }}
            >
              {categoryDisplayLabel}
            </Link>

            {/* Title */}
            <h1
              className="font-sans font-bold text-ink mb-3 leading-tight"
              style={{ fontSize: '22px', letterSpacing: '-0.02em' }}
            >
              {l.title}
            </h1>

            {/* Price */}
            <p
              className={`font-mono font-medium ${hasLocationPill ? 'mb-2' : 'mb-5'}`}
              style={{ fontSize: '24px', color: '#FF6B35', letterSpacing: '-0.02em' }}
            >
              {formatPrice(l.price, l.price_unit ?? 'total', priceVisible)}
            </p>

            {hasLocationPill && (
              <div className="mb-5">
                <ListingLocationPill
                  locationCity={l.location_city}
                  locationState={l.location_state}
                  countryName={l.countries?.name}
                  countryIsoCode={l.countries?.iso_code}
                />
              </div>
            )}

            {/* Divider */}
            <div className="mb-5" style={{ borderTop: '1px solid #F0F1F2' }} />

            {/* ── Specifications ── */}
            {specs.length > 0 && (
              <>
                <p className="font-sans font-bold text-ink mb-4" style={{ fontSize: '14px' }}>
                  Specifications
                </p>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    columnGap: '24px',
                    marginBottom: '20px',
                  }}
                >
                  {specs.map((spec, idx) => {
                    const isOddTotal = specs.length % 2 === 1
                    const isLast = idx === specs.length - 1
                    const spanFull = isOddTotal && isLast
                    const isLastRow = isOddTotal ? isLast : idx >= specs.length - 2
                    return (
                      <div
                        key={spec.label}
                        style={{
                          gridColumn: spanFull ? '1 / -1' : undefined,
                          borderBottom: isLastRow ? 'none' : '1px solid #F0F1F2',
                          paddingTop: '12px',
                          paddingBottom: '12px',
                        }}
                      >
                        <span
                          className="block font-mono uppercase"
                          style={{ fontSize: '12px', letterSpacing: '0.08em', color: '#B0B0B8', marginBottom: '4px' }}
                        >
                          {spec.label}
                        </span>
                        <span
                          className="block font-mono font-semibold text-ink"
                          style={{ fontSize: '15px' }}
                        >
                          {spec.value}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* Divider after specs */}
                <div className="mb-5" style={{ borderTop: '1px solid #F0F1F2' }} />
              </>
            )}

            {/* ── Description ── */}
            {l.description && (
              <>
                <p className="font-sans font-bold text-ink mb-3" style={{ fontSize: '14px' }}>
                  Description
                </p>
                <p
                  className="font-sans whitespace-pre-line mb-5"
                  style={{ fontSize: '14px', color: '#4A4D52', lineHeight: '1.9' }}
                >
                  {l.description}
                </p>

                {/* Divider after description */}
                <div className="mb-5" style={{ borderTop: '1px solid #F0F1F2' }} />
              </>
            )}

            {/* ── Contact Seller — always visible ── */}
            <p className="font-sans font-bold text-ink mb-4" style={{ fontSize: '14px' }}>
              Contact Seller
            </p>
            <div className="mb-5">
              <InquiryForm listingId={l.id} sellerId={l.seller_id} />
            </div>

            {/* ── Listed By ── */}
            {seller?.company_name && (
              <>
                <div className="mb-5" style={{ borderTop: '1px solid #F0F1F2' }} />

                <div>
                  <p
                    className="font-mono uppercase tracking-wider mb-4"
                    style={{ fontSize: '11px', color: '#B0B0B8' }}
                  >
                    Listed By
                  </p>

                  {/* Entire row is a link when company_slug exists */}
                  {seller.company_slug ? (
                    <Link
                      href={`/sellers/${seller.company_slug}`}
                      className="group flex items-center gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        {/* Company name + BD Verified badge */}
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <span
                            className="font-sans font-bold text-ink group-hover:text-orange transition-colors truncate"
                            style={{ fontSize: '14px' }}
                          >
                            {seller.company_name}
                          </span>
                          <BDVerifiedBadge plan={seller.plan} size="sm" />
                        </div>

                        {/* Member since */}
                        <p className="font-mono text-ink-3" style={{ fontSize: '11px' }}>
                          Member since{' '}
                          {new Date(seller.created_at).toLocaleDateString('en-US', {
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </Link>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <span className="font-sans font-bold text-ink truncate" style={{ fontSize: '14px' }}>
                            {seller.company_name}
                          </span>
                          <BDVerifiedBadge plan={seller.plan} size="sm" />
                        </div>

                        <p className="font-mono text-ink-3" style={{ fontSize: '11px' }}>
                          Member since{' '}
                          {new Date(seller.created_at).toLocaleDateString('en-US', {
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Related Listings ── */}
        {related && related.length > 0 && (
          <>
            <div className="border-t border-[#E8E9EA] mb-7" />
            <p className="font-sans font-bold text-ink mb-5" style={{ fontSize: '16px' }}>
              Related Listings
            </p>
            <ListingCardGrid>
              {(related as Listing[]).map(rel => (
                <ListingCard key={rel.id} listing={rel} isLoggedIn={!!user} openInNewTab />
              ))}
            </ListingCardGrid>
          </>
        )}

        </div>
      </div>
    </>
  )
}
