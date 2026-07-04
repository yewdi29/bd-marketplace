import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/rigburrito/auth'
import { createServiceClient } from '@/lib/rigburrito/service'
import { calculateMRR } from '@/lib/rigburrito/stripe'
import { calcTrendPct } from '@/lib/rigburrito/utils'

export async function GET() {
  const auth = await requireAdminApi()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const service = createServiceClient()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const lastMonthEnd = monthStart

  const [
    { count: totalUsers },
    { count: activeListings },
    { count: totalListings },
    { count: newSignupsMonth },
    { count: newListingsMonth },
    { count: signupsLastMonth },
    { count: listingsLastMonth },
    { count: activeLastMonth },
    { count: totalLastMonth },
    { data: recentUsers },
    { data: pendingListings },
  ] = await Promise.all([
    service.from('users').select('*', { count: 'exact', head: true }),
    service.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    service.from('listings').select('*', { count: 'exact', head: true }),
    service.from('users').select('*', { count: 'exact', head: true }).gte('created_at', monthStart),
    service.from('listings').select('*', { count: 'exact', head: true }).gte('created_at', monthStart),
    service.from('users').select('*', { count: 'exact', head: true })
      .gte('created_at', lastMonthStart).lt('created_at', lastMonthEnd),
    service.from('listings').select('*', { count: 'exact', head: true })
      .gte('created_at', lastMonthStart).lt('created_at', lastMonthEnd),
    service.from('listings').select('*', { count: 'exact', head: true })
      .eq('status', 'active').lt('created_at', monthStart),
    service.from('listings').select('*', { count: 'exact', head: true }).lt('created_at', monthStart),
    service.from('users')
      .select('id, full_name, email, plan, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
    service.from('listings')
      .select('id, title, status, price, created_at, seller_id, users(full_name, email)')
      .eq('status', 'pending_review')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  let mrr = 0
  try {
    mrr = await calculateMRR()
  } catch {
    mrr = 0
  }

  const pendingListingsFormatted = (pendingListings ?? []).map(l => {
    const seller = l.users as unknown as { full_name: string | null; email: string } | null
    return {
      id: l.id,
      title: l.title,
      status: l.status,
      price: l.price,
      created_at: l.created_at,
      seller_name: seller?.full_name ?? seller?.email ?? 'Unknown',
    }
  })

  return NextResponse.json({
    success: true,
    stats: {
      total_users: totalUsers ?? 0,
      active_listings: activeListings ?? 0,
      total_listings: totalListings ?? 0,
      mrr,
      new_signups_month: newSignupsMonth ?? 0,
      new_listings_month: newListingsMonth ?? 0,
      users_trend_pct: calcTrendPct(newSignupsMonth ?? 0, signupsLastMonth ?? 0),
      active_listings_trend_pct: calcTrendPct(activeListings ?? 0, activeLastMonth ?? 0),
      total_listings_trend_pct: calcTrendPct(totalListings ?? 0, totalLastMonth ?? 0),
      mrr_trend_pct: null,
      signups_trend_pct: calcTrendPct(newSignupsMonth ?? 0, signupsLastMonth ?? 0),
      listings_trend_pct: calcTrendPct(newListingsMonth ?? 0, listingsLastMonth ?? 0),
    },
    recent_users: recentUsers ?? [],
    pending_listings: pendingListingsFormatted,
  })
}
