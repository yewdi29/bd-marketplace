import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/rigburrito/auth'
import { createServiceClient } from '@/lib/rigburrito/service'

const PAGE_SIZE = 25

export async function GET(req: NextRequest) {
  const auth = await requireAdminApi()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { searchParams } = req.nextUrl
  const tab = searchParams.get('tab') ?? 'all'
  const status = searchParams.get('status') ?? ''
  const tier = searchParams.get('tier') ?? ''
  const search = searchParams.get('search') ?? ''
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const offset = (page - 1) * PAGE_SIZE

  const service = createServiceClient()

  let query = service
    .from('leads')
    .select(
      `id, listing_id, seller_id, buyer_id, buyer_name, buyer_email, buyer_phone, buyer_company,
       message, status, tier, reviewed_by, reviewed_at, created_at, updated_at,
       listings(title, slug, price, price_unit, tier),
       reviewer:reviewed_by(full_name)`,
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })

  if (tab === 'pending') {
    query = query.eq('status', 'pending_review')
  } else {
    query = query.range(offset, offset + PAGE_SIZE - 1)
    if (status) query = query.eq('status', status)
    if (tier) query = query.eq('tier', tier)
    if (search) {
      query = query.or(`buyer_name.ilike.%${search}%,buyer_email.ilike.%${search}%`)
    }
  }

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const leads = (data ?? []).map(row => {
    const listing = row.listings as unknown as {
      title: string
      slug: string | null
      price: number
      price_unit: string
      tier: string | null
    } | null
    const reviewer = row.reviewer as unknown as { full_name: string | null } | null
    return {
      ...row,
      listing_title: listing?.title ?? null,
      listing_slug: listing?.slug ?? null,
      listing_price: listing?.price ?? null,
      listing_price_unit: listing?.price_unit ?? 'total',
      listing_tier: listing?.tier ?? row.tier,
      reviewer_name: reviewer?.full_name ?? null,
      listings: undefined,
      reviewer: undefined,
    }
  })

  if (tab === 'pending') {
    return NextResponse.json({ success: true, leads, total: leads.length })
  }

  return NextResponse.json({
    success: true,
    leads,
    total: count ?? 0,
    page,
    page_size: PAGE_SIZE,
    total_pages: Math.ceil((count ?? 0) / PAGE_SIZE),
  })
}
