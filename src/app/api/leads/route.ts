import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/rigburrito/service'
import {
  sendAdminInquiryAlert,
  type InquiryEmailContext,
} from '@/lib/email/inquiryEmails'
import { dispatchInquiryReceivedBuyerEmail } from '@/lib/email/transactionalEmails'
import { scheduleInquiryVerification } from '@/lib/inquiryVerification/scheduleVerification'

type DealTier = 'green' | 'yellow' | 'red'

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
  const { listing_id, seller_id: body_seller_id, buyer_name, buyer_email, buyer_phone, buyer_company, message } = body

  if (!buyer_name || !buyer_email || !message) {
    return NextResponse.json(
      { error: 'buyer_name, buyer_email, and message are required' },
      { status: 400 }
    )
  }

  if (!listing_id && !body_seller_id) {
    return NextResponse.json(
      { error: 'Either listing_id or seller_id is required' },
      { status: 400 }
    )
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(buyer_email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  const { data: { user } } = await supabase.auth.getUser()

  if (listing_id && !user) {
    return NextResponse.json(
      { error: 'Sign in to submit an inquiry on a listing.' },
      { status: 401 }
    )
  }

  const service = createServiceClient()

  // ── Path A: listing-specific inquiry ──────────────────────────────────────
  if (listing_id) {
    const { data: listing, error: listingError } = await service
      .from('listings')
      .select(`
        id, seller_id, tier, status, title, price, price_unit, slug,
        users!listings_seller_id_fkey(email)
      `)
      .eq('id', listing_id)
      .single()

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    if (listing.status !== 'active') {
      return NextResponse.json({ error: 'Listing is not active' }, { status: 400 })
    }

    const dealTier = (listing.tier ?? 'green') as DealTier
    const leadStatus = dealTier === 'green' ? 'new' : 'pending_review'

    const { data, error } = await service
      .from('leads')
      .insert({
        listing_id,
        seller_id: listing.seller_id,
        buyer_id: user!.id,
        buyer_name,
        buyer_email,
        buyer_phone: buyer_phone ?? null,
        buyer_company: buyer_company ?? null,
        message,
        tier: listing.tier,
        status: leadStatus,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const emailCtx: InquiryEmailContext = {
      listingTitle: listing.title,
      listingPrice: Number(listing.price),
      priceUnit: listing.price_unit ?? 'total',
      listingSlug: listing.slug,
      buyerName: buyer_name,
      buyerEmail: buyer_email,
      buyerPhone: buyer_phone,
      buyerCompany: buyer_company,
      message,
    }

    // Buyer confirmation immediately — never waits on verification.
    void dispatchInquiryReceivedBuyerEmail({
      buyerEmail: buyer_email,
      leadId: data.id,
      listingTitle: listing.title,
    })

    if (dealTier === 'green') {
      // Seller email is sent async after Paperclip verification (or 30s fallback cron).
      scheduleInquiryVerification(data.id)
    } else {
      void sendAdminInquiryAlert(dealTier, emailCtx)
      // Still run verification async so admin approve can load trust/risk data later.
      scheduleInquiryVerification(data.id)
    }

    return NextResponse.json({ lead: data }, { status: 201 })
  }

  // ── Path B: seller-profile direct inquiry (no listing) ────────────────────
  const { data, error } = await service
    .from('leads')
    .insert({
      listing_id: null,
      seller_id: body_seller_id,
      buyer_id: user?.id ?? null,
      buyer_name,
      buyer_email,
      buyer_phone: buyer_phone ?? null,
      buyer_company: buyer_company ?? null,
      message,
      tier: null,
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
