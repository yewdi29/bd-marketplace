import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { requireDashboardAccess } from '@/lib/organizations/auth'
import { isAtActiveListingLimit } from '@/lib/organizations/listingLimits'

// POST /api/listings/draft
// Creates an empty draft listing and returns its ID.
// Called immediately when the New Listing modal opens.
export async function POST() {
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

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Check plan listing limit before creating the draft
  const { atLimit, limit } = await isAtActiveListingLimit(adminClient, user.id)

  if (atLimit) {
    return NextResponse.json(
      {
        error: `You've reached your ${limit} active listing limit. Upgrade your membership for more listings.`,
        upgrade: true,
      },
      { status: 403 }
    )
  }

  // Create placeholder draft — triggers (tier, slug, limit) fire here
  let data: { id: string } | null = null
  let insertError: { message: string } | null = null

  try {
    const result = await adminClient
      .from('listings')
      .insert({
        seller_id: user.id,
        title: 'Untitled Draft',
        category: 'other',
        price: 0,
        price_unit: 'total',
        status: 'draft',
      })
      .select('id')
      .single()
    data = result.data
    insertError = result.error
  } catch (err) {
    console.error('Draft insert threw:', err)
    return NextResponse.json({ error: 'Failed to create draft. Please try again.' }, { status: 500 })
  }

  if (insertError || !data) {
    console.error('Draft insert error:', insertError)
    // DB trigger fires when the insert would exceed the plan limit.
    // Detect that case and return the same upgrade flag as the pre-check above.
    const msg = insertError?.message ?? ''
    const isTriggerLimitError =
      msg.toLowerCase().includes('listing') &&
      (msg.toLowerCase().includes('limit') || msg.toLowerCase().includes('maximum') || msg.toLowerCase().includes('upgrade'))
    if (isTriggerLimitError) {
      return NextResponse.json(
        {
          error: `You've reached your ${limit} active listing limit. Upgrade your membership for more listings.`,
          upgrade: true,
        },
        { status: 403 }
      )
    }
    return NextResponse.json({ error: msg || 'Failed to create draft.' }, { status: 500 })
  }

  return NextResponse.json({ listing_id: data.id }, { status: 201 })
}
