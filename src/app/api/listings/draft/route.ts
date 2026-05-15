import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

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

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Check free-plan listing limit before creating the draft
  const { data: profile } = await adminClient
    .from('users')
    .select('plan')
    .eq('id', user.id)
    .single()

  if (profile?.plan === 'free') {
    const { count } = await adminClient
      .from('listings')
      .select('id', { count: 'exact', head: true })
      .eq('seller_id', user.id)
      .neq('status', 'removed')

    if ((count ?? 0) >= 3) {
      return NextResponse.json(
        { error: 'Free plan allows up to 3 listings. Upgrade to Premium for unlimited.' },
        { status: 403 }
      )
    }
  }

  // Create placeholder draft — triggers (tier, slug, limit) fire here
  const { data, error } = await adminClient
    .from('listings')
    .insert({
      seller_id: user.id,
      title: 'Untitled Draft',
      category: 'other',
      price: 0,
      status: 'draft',
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ listing_id: data.id }, { status: 201 })
}
