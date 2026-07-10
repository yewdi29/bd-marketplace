import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/rigburrito/auth'
import { createServiceClient } from '@/lib/rigburrito/service'
import { calculateMRR } from '@/lib/rigburrito/stripe'
import { calcTrendPct } from '@/lib/rigburrito/utils'
import {
  buildActiveListingsHistory,
  buildCumulativeUserHistory,
  buildMrrHistory,
  buildWeekLabels,
  buildWeeklyCountHistory,
} from '@/lib/rigburrito/dashboardHistory'

function buildUserLocations(
  users: { country: string | null }[],
  countries: { name: string; iso_code: string | null }[],
) {
  const isoByName = new Map(
    countries.map(c => [c.name.trim().toLowerCase(), c.iso_code]),
  )

  const counts = new Map<string, number>()
  for (const user of users) {
    const key = user.country?.trim() || 'Unknown'
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  const unknownCount = counts.get('Unknown') ?? 0
  counts.delete('Unknown')

  const sortedKnown = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])
  const maxKnown = unknownCount > 0 ? 7 : 8
  const rows = sortedKnown.slice(0, maxKnown).map(([country, count]) => ({
    country,
    iso_code: isoByName.get(country.toLowerCase()) ?? null,
    count,
  }))

  if (unknownCount > 0) {
    rows.push({ country: 'Unknown', iso_code: null, count: unknownCount })
  }

  return rows
}

function buildUserLocationsFull(
  users: { country: string | null }[],
  countries: { name: string; iso_code: string | null }[],
) {
  const isoByName = new Map(
    countries.map(c => [c.name.trim().toLowerCase(), c.iso_code]),
  )

  const counts = new Map<string, number>()
  for (const user of users) {
    const key = user.country?.trim() || 'Unknown'
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([country, count]) => ({
      country,
      iso_code: isoByName.get(country.toLowerCase()) ?? null,
      count,
    }))
}

export async function GET() {
  const auth = await requireAdminApi()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const service = createServiceClient()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const lastMonthEnd = monthStart
  const eightWeeksAgo = new Date()
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56)

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
    { data: allUsers },
    { data: recentUsers },
    { data: pendingListings },
    { data: userCountries },
    { data: countries },
    { data: allListings },
    { data: recentListings },
    { data: recentSignups },
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
    service.from('users').select('created_at, country'),
    service.from('users')
      .select('id, full_name, email, plan, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
    service.from('listings')
      .select('id, title, status, price, created_at, seller_id, users(full_name, email)')
      .eq('status', 'pending_review')
      .order('created_at', { ascending: false })
      .limit(5),
    service.from('users').select('country'),
    service.from('countries').select('name, iso_code'),
    service.from('listings').select('created_at, status'),
    service.from('listings').select('created_at').gte('created_at', eightWeeksAgo.toISOString()),
    service.from('users').select('created_at').gte('created_at', eightWeeksAgo.toISOString()),
  ])

  let mrr = 0
  try {
    mrr = await calculateMRR()
  } catch {
    mrr = 0
  }

  const weeks = buildWeekLabels()
  const metricHistory = {
    total_users: buildCumulativeUserHistory(allUsers ?? [], weeks),
    active_listings: buildActiveListingsHistory(allListings ?? [], weeks),
    mrr: buildMrrHistory(mrr, weeks),
    new_signups: buildWeeklyCountHistory(recentSignups ?? [], weeks),
    new_listings: buildWeeklyCountHistory(recentListings ?? [], weeks),
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

  const userLocationsFull = buildUserLocationsFull(userCountries ?? [], countries ?? [])

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
    metric_history: metricHistory,
    metric_history_notes: {
      active_listings:
        'Approximation: counts active listings created on or before each week — not a true historical snapshot.',
      mrr: 'Stripe MRR history is unavailable; chart shows flat current MRR across weeks.',
    },
    recent_users: recentUsers ?? [],
    pending_listings: pendingListingsFormatted,
    user_locations: buildUserLocations(userCountries ?? [], countries ?? []),
    user_locations_full: userLocationsFull,
  })
}
