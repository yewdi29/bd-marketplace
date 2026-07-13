import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { dispatchListingApprovedEmail } from '@/lib/email/transactionalEmails'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
}

export async function PATCH(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const cookieStore = await cookies()
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: listing } = await adminClient
    .from('listings')
    .select(`
      seller_id, title, category, price, condition,
      location_city, location_state,
      country_id, region_id, state_id,
      industry_id, category_id,
      last_approved_at, last_major_edit_at, admin_flagged,
      countries(slug),
      listing_images(id)
    `)
    .eq('id', params.id)
    .single()

  if (!listing || listing.seller_id !== user.id)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // ── Plan limit check — enforce active listing cap before publishing ──────────
  const PLAN_LIMITS: Record<string, number> = {
    free: 3, starter: 15, pro: 40, max: Infinity, premium: Infinity,
  }
  const { data: profile } = await adminClient
    .from('users')
    .select('plan')
    .eq('id', user.id)
    .single()
  const plan = profile?.plan ?? 'free'
  const planLimit = PLAN_LIMITS[plan] ?? 3
  if (planLimit !== Infinity) {
    const { count } = await adminClient
      .from('listings')
      .select('id', { count: 'exact', head: true })
      .eq('seller_id', user.id)
      .eq('status', 'active')
    if ((count ?? 0) >= planLimit) {
      return NextResponse.json(
        { error: `You've reached your ${planLimit} active listing limit. Upgrade your membership for more listings.`, upgrade: true },
        { status: 403 },
      )
    }
  }

  // Validate required fields before going live
  type CountryEmbed = { slug: string } | { slug: string }[] | null
  const countryEmbed = listing.countries as CountryEmbed
  const countrySlug = Array.isArray(countryEmbed)
    ? countryEmbed[0]?.slug ?? null
    : countryEmbed?.slug ?? null
  const hasCategory = !!(listing.category_id || (listing.category && listing.category !== 'other'))
  const hasLocation = (() => {
    if (!listing.country_id) return false
    if (countrySlug === 'mexico') return true
    return !!(listing.location_city && listing.state_id)
  })()

  if (
    !listing.title || listing.title === 'Untitled Draft' ||
    !hasCategory ||
    !listing.condition ||
    !hasLocation
  ) {
    return NextResponse.json(
      { error: 'Listing is missing required fields. Complete all fields in the form before publishing.' },
      { status: 400 }
    )
  }

  const images = listing.listing_images as { id: string }[] | null
  if (!images || images.length < 1) {
    return NextResponse.json(
      { error: 'Listing is missing required fields. Complete all fields in the form before publishing.' },
      { status: 400 }
    )
  }

  // Regenerate slug from the final title so drafts don't keep 'untitled-draft-xxx'
  const slug = `${slugify(listing.title)}-${params.id.slice(0, 8)}`

  // First publish always requires review; republish skips review if no major edits since approval.
  // Listings flagged by admin must always re-enter review — never bypass the agent.
  let status: 'active' | 'pending_review'
  if (listing.admin_flagged) {
    status = 'pending_review'
  } else if (!listing.last_approved_at) {
    status = 'pending_review'
  } else if (
    !listing.last_major_edit_at ||
    listing.last_major_edit_at <= listing.last_approved_at
  ) {
    status = 'active'
  } else {
    status = 'pending_review'
  }

  const { error } = await adminClient
    .from('listings')
    .update({ status, slug, updated_at: new Date().toISOString() })
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (status === 'active') {
    const { data: sellerProfile } = await adminClient
      .from('users')
      .select('email')
      .eq('id', user.id)
      .single()

    if (sellerProfile?.email) {
      await dispatchListingApprovedEmail({
        sellerEmail: sellerProfile.email,
        listingId: params.id,
        listingTitle: listing.title,
        listingSlug: slug,
      })
    }
  }

  return NextResponse.json({ success: true, status })
}
