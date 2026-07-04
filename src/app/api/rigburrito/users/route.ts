import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/rigburrito/auth'
import { createServiceClient } from '@/lib/rigburrito/service'
import { getListingLimit } from '@/lib/planLimits'
import type { MembershipPlan } from '@/lib/types/database'

const PAGE_SIZE = 25

export async function GET(req: NextRequest) {
  const auth = await requireAdminApi()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { searchParams } = req.nextUrl
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const search = searchParams.get('search') ?? ''
  const plan = searchParams.get('plan') ?? ''
  const offset = (page - 1) * PAGE_SIZE

  const service = createServiceClient()
  let query = service
    .from('users')
    .select('id, email, full_name, company_name, phone, city, state, country, avatar_url, plan, role, suspended, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
  }
  if (plan) query = query.eq('plan', plan)

  const { data: users, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const enriched = await Promise.all(
    (users ?? []).map(async u => {
      const plan = u.plan as MembershipPlan
      const [{ count: activeListingCount }, { count: savedCount }] = await Promise.all([
        service.from('listings').select('*', { count: 'exact', head: true })
          .eq('seller_id', u.id).eq('status', 'active'),
        service.from('saved_listings').select('*', { count: 'exact', head: true }).eq('user_id', u.id),
      ])
      return {
        ...u,
        listing_count: activeListingCount ?? 0,
        listing_limit: getListingLimit(plan),
        saved_count: savedCount ?? 0,
      }
    }),
  )

  return NextResponse.json({
    success: true,
    users: enriched,
    total: count ?? 0,
    page,
    page_size: PAGE_SIZE,
    total_pages: Math.ceil((count ?? 0) / PAGE_SIZE),
  })
}
