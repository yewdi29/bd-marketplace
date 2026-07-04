import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/rigburrito/auth'
import { createServiceClient } from '@/lib/rigburrito/service'

const PAGE_SIZE = 25

export async function GET(req: NextRequest) {
  const auth = await requireAdminApi()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { searchParams } = req.nextUrl
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const search = searchParams.get('search') ?? ''
  const tab = searchParams.get('tab') ?? 'pending'
  const industry = searchParams.get('industry') ?? ''
  const category = searchParams.get('category') ?? ''
  const offset = (page - 1) * PAGE_SIZE

  const service = createServiceClient()
  let query = service
    .from('listings')
    .select(
      `id, title, slug, seller_id, category, price, location_city, location_state,
       status, tier, admin_flagged, created_at, industry_id, category_id,
       users!listings_seller_id_fkey(full_name, email),
       industries(name),
       listing_images(url, is_primary, sort_order)`,
      { count: 'exact' },
    )
    .neq('status', 'draft')
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (tab === 'pending') {
    query = query.eq('status', 'pending_review')
  } else if (tab === 'live') {
    query = query.eq('status', 'active')
  }

  if (search) query = query.or(`title.ilike.%${search}%`)
  if (industry) query = query.eq('industry_id', industry)
  if (category) query = query.eq('category_id', category)

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const listings = (data ?? []).map(l => {
    const seller = l.users as unknown as { full_name: string | null; email: string } | null
    const industryRow = l.industries as unknown as { name: string } | null
    const images = (l.listing_images as unknown as { url: string; is_primary: boolean; sort_order: number }[]) ?? []
    const primary = images.find(i => i.is_primary) ?? images.sort((a, b) => a.sort_order - b.sort_order)[0]
    return {
      id: l.id,
      title: l.title,
      slug: l.slug,
      seller_id: l.seller_id,
      seller_name: seller?.full_name ?? seller?.email ?? 'Unknown',
      seller_email: seller?.email ?? null,
      category: l.category,
      industry_name: industryRow?.name ?? null,
      price: l.price,
      location_city: l.location_city,
      location_state: l.location_state,
      status: l.status,
      tier: l.tier,
      admin_flagged: l.admin_flagged ?? false,
      created_at: l.created_at,
      primary_image_url: primary?.url ?? null,
    }
  })

  if (search) {
    const filtered = listings.filter(
      l => l.title.toLowerCase().includes(search.toLowerCase()) ||
        (l.seller_name?.toLowerCase().includes(search.toLowerCase()) ?? false),
    )
    return NextResponse.json({
      success: true,
      listings: filtered,
      total: filtered.length,
      page,
      page_size: PAGE_SIZE,
      total_pages: Math.ceil(filtered.length / PAGE_SIZE),
    })
  }

  return NextResponse.json({
    success: true,
    listings,
    total: count ?? 0,
    page,
    page_size: PAGE_SIZE,
    total_pages: Math.ceil((count ?? 0) / PAGE_SIZE),
  })
}
