import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/rigburrito/service'
import {
  sendAdminInquiryAlert,
  type InquiryEmailContext,
} from '@/lib/email/inquiryEmails'
import {
  dispatchInquiryReceivedBuyerEmail,
  dispatchNewInquirySellerEmail,
} from '@/lib/email/transactionalEmails'

type DealTier = 'green' | 'yellow' | 'red'

async function processInquiryNotifications(
  dealTier: DealTier,
  sellerEmail: string,
  ctx: InquiryEmailContext,
  leadId: string,
): Promise<void> {
  await dispatchInquiryReceivedBuyerEmail({
    buyerEmail: ctx.buyerEmail,
    leadId,
    listingTitle: ctx.listingTitle,
  })

  if (dealTier === 'green') {
    await dispatchNewInquirySellerEmail({
      sellerEmail,
      leadId,
      listingTitle: ctx.listingTitle,
      buyerName: ctx.buyerName,
      buyerEmail: ctx.buyerEmail,
      buyerCompany: ctx.buyerCompany,
      buyerPhone: ctx.buyerPhone,
      buyerMessage: ctx.message,
    })
  } else {
    await sendAdminInquiryAlert(dealTier, ctx)
  }
}

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
        buyer_id: user?.id ?? null,
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

    const seller = listing.users as unknown as { email: string } | null
    const sellerEmail = seller?.email
    if (sellerEmail) {
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
      await processInquiryNotifications(dealTier, sellerEmail, emailCtx, data.id)
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
