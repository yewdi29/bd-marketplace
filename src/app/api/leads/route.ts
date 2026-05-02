import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet: { name: string; value: string; options: CookieOptions }[]) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const body = await request.json()
  const { listing_id, buyer_name, buyer_email, buyer_phone, buyer_company, message } = body

  if (!listing_id || !buyer_name || !buyer_email || !message) {
    return NextResponse.json(
      { error: 'listing_id, buyer_name, buyer_email, and message are required' },
      { status: 400 }
    )
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(buyer_email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  // Fetch listing to get seller_id and tier
  const { data: listing, error: listingError } = await supabase
    .from('listings')
    .select('id, seller_id, tier, status')
    .eq('id', listing_id)
    .single()

  if (listingError || !listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  }

  if (listing.status !== 'active') {
    return NextResponse.json({ error: 'Listing is not active' }, { status: 400 })
  }

  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('leads')
    .insert({
      listing_id,
      seller_id: listing.seller_id,
      buyer_id: user?.id ?? null,
      buyer_name,
      buyer_email,
      buyer_phone: buyer_phone ?? null,
      buyer_company: buyer_company ?? null,
      message,
      tier: listing.tier,
      status: 'new',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ lead: data }, { status: 201 })
}

export async function GET(_request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('leads')
    .select('*, listings(title, slug, tier)')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ leads: data })
}
