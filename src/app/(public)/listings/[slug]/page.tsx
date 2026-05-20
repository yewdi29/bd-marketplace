import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import type { Listing } from '@/lib/types/database'
import { formatPrice } from '@/lib/formatPrice'
import PhotoGallery from './PhotoGallery'
import InquiryForm from './InquiryForm'
import ListingActions from './ListingActions'
import ListingCard from '@/components/ListingCard'

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

function condLabel(val: string) {
  return CONDITION_LABELS[val] ?? val.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function isNewListing(createdAt: string): boolean {
  const age = Date.now() - new Date(createdAt).getTime()
  return age < 7 * 24 * 60 * 60 * 1000
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('listings')
    .select('title, meta_description, description, listing_images(url, is_primary, sort_order)')
    .eq('slug', params.slug)
    .eq('status', 'active')
    .single()

  if (!data) return { title: 'Listing Not Found | Black Diamond Marketplace' }

  const imgs = (data.listing_images ?? []) as { url: string; is_primary: boolean; sort_order: number }[]
  const primaryImg = imgs.find(i => i.is_primary) ?? imgs.sort((a, b) => a.sort_order - b.sort_order)[0]

  const description = data.meta_description ?? data.description?.slice(0, 160) ?? undefined

  return {
    title: `${data.title} | Black Diamond Marketplace`,
    description,
    openGraph: {
      title: data.title,
      description: description ?? undefined,
      images: primaryImg ? [{ url: primaryImg.url }] : [],
      type: 'website',
    },
  }
}

// ─── Specs row helper ─────────────────────────────────────────────────────────

function SpecRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="py-3 flex flex-col gap-0.5">
      <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-ink-3">{label}</span>
      <span className="font-mono text-sm font-bold text-ink">{value}</span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ListingDetailPage({ params }: Props) {
  const supabase = await createClient()

  // Fetch listing + images in one query
  const { data: listing } = await supabase
    .from('listings')
    .select('*, listing_images(*)')
    .eq('slug', params.slug)
    .single()

  if (!listing || listing.status !== 'active') notFound()

  const l = listing as Listing & { price_visible?: boolean }

  // Fetch related listings (same category, different id, active, limit 4)
  const { data: related } = await supabase
    .from('listings')
    .select('*, listing_images(*)')
    .eq('category', l.category)
    .eq('status', 'active')
    .neq('id', l.id)
    .order('created_at', { ascending: false })
    .limit(4)

  // Check if current user has saved this listing
  const { data: { user } } = await supabase.auth.getUser()
  let isSaved = false
  if (user) {
    const { data: savedRow } = await supabase
      .from('saved_listings')
      .select('id')
      .eq('user_id', user.id)
      .eq('listing_id', l.id)
      .maybeSingle()
    isSaved = !!savedRow
  }

  const images = (l.listing_images ?? []).sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1
    if (!a.is_primary && b.is_primary) return 1
    return a.sort_order - b.sort_order
  })

  const priceVisible = l.price_visible !== false // default true if column missing
  const isNew = isNewListing(l.created_at)

  // Dynamic specs from AI-generated JSONB field — only non-empty values
  const aiSpecs: { label: string; value: string | number }[] = l.specs
    ? Object.entries(l.specs)
        .filter(([, v]) => v != null && String(v).trim() !== '')
        .map(([k, v]) => ({ label: k, value: String(v) }))
    : []

  // Build specs — structured fields first, then dynamic AI specs
  const specs: { label: string; value: string | number }[] = [
    l.year ? { label: 'Year', value: l.year } : null,
    l.manufacturer ? { label: 'Manufacturer', value: l.manufacturer } : null,
    l.model ? { label: 'Model', value: l.model } : null,
    l.condition ? { label: 'Condition', value: condLabel(l.condition) } : null,
    { label: 'Category', value: catLabel(l.category) },
    (l.location_city || l.location_state)
      ? { label: 'Location', value: [l.location_city, l.location_state].filter(Boolean).join(', ') }
      : null,
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
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="bg-bg min-h-screen pb-20">

        {/* Breadcrumb */}
        <div
          className="max-w-[1200px] mx-auto px-8 flex items-center gap-2 py-3"
          style={{ fontSize: '12px' }}
        >
          <Link href="/listings" className="text-ink-3 hover:text-ink transition-colors font-sans">
            Browse
          </Link>
          <span className="text-ink-3">/</span>
          <Link
            href={`/listings?category=${l.category}`}
            className="text-ink-3 hover:text-ink transition-colors font-sans"
          >
            {catLabel(l.category)}
          </Link>
          <span className="text-ink-3">/</span>
          <span className="text-ink font-sans font-medium truncate max-w-[300px]">{l.title}</span>
        </div>

        {/* Photo gallery — full width */}
        <PhotoGallery images={images} title={l.title} />

        {/* Two column layout */}
        <div
          className="max-w-[1200px] mx-auto px-8"
          style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', padding: '24px 32px' }}
        >
          {/* ── Left column ── */}
          <div className="flex flex-col gap-4 min-w-0">

            {/* Title card */}
            <div
              className="bg-white border border-[#E8E9EA] flex flex-col gap-0"
              style={{ borderRadius: '16px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
            >
              <p className="font-mono text-[12px] uppercase tracking-[0.08em] text-ink-3 mb-2">
                {catLabel(l.category)}
              </p>
              {/* Title + Price on same row (B015) */}
              <div className="flex items-start justify-between gap-4">
                <h1
                  className="font-sans font-bold text-ink leading-tight flex-1 min-w-0"
                  style={{ fontSize: '20px', letterSpacing: '-0.02em' }}
                >
                  {l.title}
                </h1>
                <span
                  className="font-mono font-medium shrink-0"
                  style={{ fontSize: '20px', letterSpacing: '-0.02em', color: '#FF6B35' }}
                >
                  {formatPrice(l.price, l.price_unit ?? 'total', priceVisible)}
                </span>
              </div>

              <div className="border-t border-[#E8E9EA] my-4" />

              {/* Condition + Location + New badge pills */}
              <div className="flex flex-wrap items-center gap-2">
                {l.condition && (
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill border font-mono text-[11px] font-bold"
                    style={{ background: '#F0FFF0', color: '#1A5C18', borderColor: '#C8F5C4' }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#A2FF9A]" />
                    {condLabel(l.condition)}
                  </span>
                )}
                {(l.location_city || l.location_state) && (
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill border font-mono text-[11px] font-bold"
                    style={{ background: '#E6F0FF', color: '#004499', borderColor: '#B3D1FF' }}
                  >
                    📍 {[l.location_city, l.location_state].filter(Boolean).join(', ')}
                  </span>
                )}
                {isNew && (
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill border font-mono text-[11px] font-bold"
                    style={{ background: '#F0FFF0', color: '#1A5C18', borderColor: '#C8F5C4' }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#A2FF9A]" />
                    New Listing
                  </span>
                )}
              </div>

            </div>

            {/* Specs card */}
            {specs.length > 0 && (
              <div
                className="bg-white border border-[#E8E9EA]"
                style={{ borderRadius: '16px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
              >
                <p className="font-sans font-bold text-ink mb-3" style={{ fontSize: '14px' }}>
                  Specifications
                </p>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                  }}
                >
                  {specs.map((spec, idx) => {
                    const isLastRow = idx >= specs.length - (specs.length % 2 === 0 ? 2 : 1)
                    const isRightCol = idx % 2 === 1
                    return (
                      <div
                        key={spec.label}
                        style={{
                          borderBottom: isLastRow ? 'none' : '1px solid #E8E9EA',
                          borderLeft: isRightCol ? '1px solid #E8E9EA' : 'none',
                          paddingLeft: isRightCol ? '16px' : '0',
                        }}
                      >
                        <SpecRow label={spec.label} value={spec.value} />
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Description card */}
            {l.description && (
              <div
                className="bg-white border border-[#E8E9EA]"
                style={{ borderRadius: '16px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
              >
                <p className="font-sans font-bold text-ink mb-3" style={{ fontSize: '14px' }}>
                  Description
                </p>
                <p
                  className="font-sans text-ink-2 whitespace-pre-line"
                  style={{ fontSize: '14px', lineHeight: '1.8' }}
                >
                  {l.description}
                </p>
              </div>
            )}
          </div>

          {/* ── Right column ── */}
          <div className="flex flex-col gap-3" style={{ position: 'sticky', top: '72px', alignSelf: 'start' }}>

            {/* Inquiry card */}
            <div
              className="bg-white border border-[#E8E9EA]"
              style={{
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              }}
            >
              <p className="font-sans font-bold text-ink mb-1" style={{ fontSize: '16px' }}>
                Contact Seller
              </p>
              <p className="font-sans text-ink-3 mb-4" style={{ fontSize: '12px' }}>
                Fill out the form below and the seller will get back to you directly.
              </p>

              <InquiryForm listingId={l.id} sellerId={l.seller_id} />
            </div>

            {/* Save + Share */}
            <ListingActions
              listingId={l.id}
              initialSaved={isSaved}
              isLoggedIn={!!user}
              listingTitle={l.title}
            />
          </div>
        </div>

        {/* Related listings */}
        {related && related.length > 0 && (
          <div className="max-w-[1200px] mx-auto px-8">
            <div className="border-t border-[#E8E9EA]" style={{ margin: '0 0 28px' }} />
            <p className="font-sans font-bold text-ink mb-5" style={{ fontSize: '16px' }}>
              Related Listings
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(related as Listing[]).map(rel => (
                <ListingCard key={rel.id} listing={rel} isLoggedIn={!!user} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
