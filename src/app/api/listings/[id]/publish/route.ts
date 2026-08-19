import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { dispatchListingApprovedEmail } from '@/lib/email/transactionalEmails'
import { canManageListing } from '@/lib/listings/canManageListing'
import { scheduleListingVerification } from '@/lib/listings/scheduleListingVerification'
import { requireDashboardAccess } from '@/lib/organizations/auth'
import {
  isAtActiveListingLimit,
  markListingLimitReachedOnce,
} from '@/lib/organizations/listingLimits'

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

  const dashboardAuth = await requireDashboardAccess()
  if (!dashboardAuth.ok) {
    return NextResponse.json(
      { error: dashboardAuth.error, billingRequired: dashboardAuth.billingRequired ?? false },
      { status: dashboardAuth.status },
    )
  }

  const allowed = await canManageListing(authClient, params.id, user.id)
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: listing } = await adminClient
    .from('listings')
    .select(`
      seller_id, title, category, price, condition, status,
      location_city, location_state,
      country_id, region_id, state_id,
      industry_id, category_id,
      last_approved_at, last_major_edit_at, admin_flagged,
      countries(slug),
      listing_images(id)
    `)
    .eq('id', params.id)
    .single()

  if (!listing)
    return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // ── Plan limit check — enforce active listing cap before publishing ──────────
  const { atLimit, limit: planLimit } = await isAtActiveListingLimit(adminClient, listing.seller_id)
  if (atLimit) {
    await markListingLimitReachedOnce(adminClient, listing.seller_id)
    return NextResponse.json(
      { error: `You've reached your ${planLimit} active listing limit. Upgrade your membership for more listings.`, upgrade: true },
      { status: 403 },
    )
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

  const previousStatus = listing.status as string | null

  const { error } = await adminClient
    .from('listings')
    .update({ status, slug, updated_at: new Date().toISOString() })
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (status === 'pending_review' && previousStatus !== 'pending_review') {
    // Primary path: fire-and-forget Paperclip Listing Verifier (mirrors inquiry trigger).
    scheduleListingVerification(params.id, { previousStatus })
  }

  if (status === 'active') {
    const { data: sellerProfile } = await adminClient
      .from('users')
      .select('email')
      .eq('id', listing.seller_id)
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
