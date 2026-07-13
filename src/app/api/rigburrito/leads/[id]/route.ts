import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/rigburrito/auth'
import { createServiceClient } from '@/lib/rigburrito/service'
import { dispatchNewInquirySellerEmail } from '@/lib/email/transactionalEmails'
import type { InquiryEmailContext } from '@/lib/email/inquiryEmails'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminApi()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await params
  const service = createServiceClient()

  const { data, error } = await service
    .from('leads')
    .select(`
      *,
      listings(title, slug, price, price_unit, tier),
      reviewer:reviewed_by(full_name)
    `)
    .eq('id', id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

  const listing = data.listings as unknown as {
    title: string
    slug: string | null
    price: number
    price_unit: string
    tier: string | null
  } | null

  return NextResponse.json({
    success: true,
    lead: {
      ...data,
      listing_title: listing?.title ?? null,
      listing_slug: listing?.slug ?? null,
      listing_price: listing?.price ?? null,
      listing_price_unit: listing?.price_unit ?? 'total',
      listing_tier: listing?.tier ?? data.tier,
    },
  })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminApi()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await params
  const body = await req.json()
  const action = body.action as 'approve' | 'deny' | 'discard' | 'commission'

  if (!['approve', 'deny', 'discard', 'commission'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const service = createServiceClient()

  const { data: lead, error: leadError } = await service
    .from('leads')
    .select(`
      *,
      listings(title, slug, price, price_unit, tier, users!listings_seller_id_fkey(email, full_name))
    `)
    .eq('id', id)
    .single()

  if (leadError || !lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  }

  if (lead.status !== 'pending_review') {
    return NextResponse.json({ error: 'Lead is not pending review' }, { status: 400 })
  }

  const listing = lead.listings as unknown as {
    title: string
    slug: string | null
    price: number
    price_unit: string
    tier: string | null
    users: { email: string; full_name: string | null } | null
  } | null

  const emailCtx: InquiryEmailContext = {
    listingTitle: listing?.title ?? 'Listing',
    listingPrice: Number(listing?.price ?? 0),
    priceUnit: listing?.price_unit ?? 'total',
    listingSlug: listing?.slug ?? null,
    buyerName: lead.buyer_name,
    buyerEmail: lead.buyer_email,
    buyerPhone: lead.buyer_phone,
    buyerCompany: lead.buyer_company,
    message: lead.message,
  }

  const now = new Date().toISOString()

  if (action === 'approve') {
    const { error } = await service
      .from('leads')
      .update({ status: 'forwarded', reviewed_by: auth.userId, reviewed_at: now })
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const sellerEmail = listing?.users?.email
    if (sellerEmail) {
      await dispatchNewInquirySellerEmail({
        sellerEmail,
        leadId: id,
        listingTitle: emailCtx.listingTitle,
        listingSlug: emailCtx.listingSlug,
        buyerName: emailCtx.buyerName,
        buyerEmail: emailCtx.buyerEmail,
        buyerCompany: emailCtx.buyerCompany,
        buyerPhone: emailCtx.buyerPhone,
        buyerMessage: emailCtx.message,
      })
    }

    return NextResponse.json({ success: true })
  }

  if (action === 'deny') {
    const { error } = await service
      .from('leads')
      .update({ status: 'denied', reviewed_by: auth.userId, reviewed_at: now })
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  }

  if (action === 'discard') {
    const { error } = await service
      .from('leads')
      .update({ status: 'discarded', reviewed_by: auth.userId, reviewed_at: now })
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  }

  // commission — convert lead to deal in Identified stage
  if (!lead.listing_id) {
    return NextResponse.json({ error: 'Lead has no associated listing' }, { status: 400 })
  }

  const dealTier = (body.deal_tier ?? listing?.tier ?? 'yellow') as 'yellow' | 'red'
  if (dealTier !== 'yellow' && dealTier !== 'red') {
    return NextResponse.json({ error: 'Invalid deal tier' }, { status: 400 })
  }

  const askingPrice = body.asking_price ?? listing?.price ?? 0
  const commissionRate = body.commission_rate ?? 7

  const { data: deal, error: dealError } = await service
    .from('deals')
    .insert({
      listing_id: lead.listing_id,
      lead_id: lead.id,
      deal_tier: dealTier,
      buyer_name: body.buyer_name ?? lead.buyer_name,
      buyer_email: body.buyer_email ?? lead.buyer_email,
      buyer_phone: body.buyer_phone ?? lead.buyer_phone,
      buyer_message: lead.message,
      seller_name: listing?.users?.full_name ?? null,
      asking_price: askingPrice,
      commission_rate: commissionRate,
      status: 'identified',
      assigned_to: null,
      notes: `Inquiry message:\n${lead.message}`,
    })
    .select()
    .single()

  if (dealError) return NextResponse.json({ error: dealError.message }, { status: 500 })

  const { error: leadUpdateError } = await service
    .from('leads')
    .update({ status: 'commission_opportunity', reviewed_by: auth.userId, reviewed_at: now })
    .eq('id', id)

  if (leadUpdateError) return NextResponse.json({ error: leadUpdateError.message }, { status: 500 })

  return NextResponse.json({ success: true, deal })
}
