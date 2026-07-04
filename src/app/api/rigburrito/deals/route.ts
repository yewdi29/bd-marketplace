import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/rigburrito/auth'
import { appendNote } from '@/lib/rigburrito/strings'
import { createServiceClient } from '@/lib/rigburrito/service'

export async function GET(req: NextRequest) {
  const auth = await requireAdminApi()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const status = req.nextUrl.searchParams.get('status') ?? ''
  const service = createServiceClient()

  let query = service
    .from('deals')
    .select(`
      *,
      listings(title, price, slug),
      assigned:assigned_to(full_name)
    `)
    .order('updated_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const deals = (data ?? []).map(d => ({
    ...d,
    listing_title: (d.listings as unknown as { title: string } | null)?.title ?? null,
    assigned_name: (d.assigned as unknown as { full_name: string | null } | null)?.full_name ?? null,
  }))

  return NextResponse.json({ success: true, deals })
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const body = await req.json()
  if (!body.listing_id) return NextResponse.json({ error: 'Listing required' }, { status: 400 })

  const service = createServiceClient()
  const { data: listing } = await service
    .from('listings')
    .select('title, price, users(full_name)')
    .eq('id', body.listing_id)
    .single()

  const price = Number(listing?.price ?? body.asking_price ?? 0)
  let dealTier = body.deal_tier
  if (!dealTier) {
    dealTier = price >= 500000 ? 'red' : 'yellow'
  }

  const seller = listing?.users as unknown as { full_name: string | null } | null

  const { data, error } = await service
    .from('deals')
    .insert({
      listing_id: body.listing_id,
      deal_tier: dealTier,
      buyer_name: body.buyer_name ?? null,
      buyer_email: body.buyer_email ?? null,
      buyer_phone: body.buyer_phone ?? null,
      seller_name: seller?.full_name ?? body.seller_name ?? null,
      asking_price: price,
      commission_rate: body.commission_rate ?? 7,
      status: 'identified',
      notes: body.notes ? appendNote(null, body.notes) : null,
      assigned_to: body.assigned_to ?? auth.userId,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, deal: data })
}
