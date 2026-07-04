import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/rigburrito/auth'
import { createServiceClient } from '@/lib/rigburrito/service'

export async function GET(req: NextRequest) {
  const auth = await requireAdminApi()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const search = req.nextUrl.searchParams.get('search') ?? ''
  const service = createServiceClient()

  let query = service
    .from('newsletter_subscribers')
    .select('id, email, subscribed_at, status', { count: 'exact' })
    .order('subscribed_at', { ascending: false })

  if (search) query = query.ilike('email', `%${search}%`)

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    success: true,
    subscribers: data ?? [],
    total: count ?? (data?.length ?? 0),
  })
}
