import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/rigburrito/auth'
import { createServiceClient } from '@/lib/rigburrito/service'

export async function GET(req: NextRequest) {
  const auth = await requireAdminApi()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const search = req.nextUrl.searchParams.get('search') ?? ''
  const service = createServiceClient()

  let query = service
    .from('listings')
    .select('id, title, price, slug, users(full_name)')
    .eq('status', 'active')
    .gte('price', 100000)
    .order('title')
    .limit(50)

  if (search) query = query.ilike('title', `%${search}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const listings = (data ?? []).map(l => ({
    id: l.id,
    title: l.title,
    price: l.price,
    slug: l.slug,
    seller_name: (l.users as unknown as { full_name: string | null } | null)?.full_name ?? null,
  }))

  return NextResponse.json({ success: true, listings })
}
