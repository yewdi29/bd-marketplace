import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/rigburrito/auth'
import { createServiceClient } from '@/lib/rigburrito/service'

function getWeekStart(d: Date): string {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff)
  date.setHours(0, 0, 0, 0)
  return date.toISOString().slice(0, 10)
}

export async function GET() {
  const auth = await requireAdminApi()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const service = createServiceClient()
  const eightWeeksAgo = new Date()
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56)

  const [
    { data: allListings },
    { data: recentListings },
    { count: totalUsers },
    { data: recentUsers },
    { data: searchQueries },
    { data: savedListings },
    { data: industries },
  ] = await Promise.all([
    service.from('listings').select('status'),
    service.from('listings').select('created_at, industry_id, industries(name)')
      .gte('created_at', eightWeeksAgo.toISOString()),
    service.from('users').select('*', { count: 'exact', head: true }),
    service.from('users').select('created_at, plan')
      .gte('created_at', eightWeeksAgo.toISOString()),
    service.from('search_queries').select('query_text'),
    service.from('saved_listings').select('listing_id, listings(title, slug, users(full_name))'),
    service.from('listings').select('industry_id, industries(name)').not('industry_id', 'is', null),
  ])

  const listingsByStatus: Record<string, number> = {}
  for (const l of allListings ?? []) {
    listingsByStatus[l.status] = (listingsByStatus[l.status] ?? 0) + 1
  }

  const listingsPerWeek: Record<string, number> = {}
  for (const l of recentListings ?? []) {
    const week = getWeekStart(new Date(l.created_at))
    listingsPerWeek[week] = (listingsPerWeek[week] ?? 0) + 1
  }

  const signupsPerWeek: Record<string, number> = {}
  for (const u of recentUsers ?? []) {
    const week = getWeekStart(new Date(u.created_at))
    signupsPerWeek[week] = (signupsPerWeek[week] ?? 0) + 1
  }

  const usersByPlan: Record<string, number> = {}
  const { data: allUsers } = await service.from('users').select('plan')
  for (const u of allUsers ?? []) {
    usersByPlan[u.plan] = (usersByPlan[u.plan] ?? 0) + 1
  }

  const listingsByIndustry: Record<string, number> = {}
  for (const l of industries ?? []) {
    const ind = l.industries as unknown as { name: string } | null
    const name = ind?.name ?? 'Unknown'
    listingsByIndustry[name] = (listingsByIndustry[name] ?? 0) + 1
  }

  const queryCounts: Record<string, number> = {}
  for (const q of searchQueries ?? []) {
    const text = q.query_text.toLowerCase().trim()
    queryCounts[text] = (queryCounts[text] ?? 0) + 1
  }
  const topQueries = Object.entries(queryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([query, count]) => ({ query, count }))

  const saveCounts: Record<string, { count: number; title: string; slug: string | null; seller: string }> = {}
  for (const s of savedListings ?? []) {
    const listing = s.listings as unknown as { title: string; slug: string | null; users: { full_name: string | null } | null } | null
    const id = s.listing_id as string
    if (!saveCounts[id]) {
      saveCounts[id] = {
        count: 0,
        title: listing?.title ?? 'Unknown',
        slug: listing?.slug ?? null,
        seller: listing?.users?.full_name ?? 'Unknown',
      }
    }
    saveCounts[id].count++
  }
  const topSaved = Object.entries(saveCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([id, data]) => ({ listing_id: id, ...data }))

  const weeks: string[] = []
  for (let i = 7; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i * 7)
    weeks.push(getWeekStart(d))
  }

  return NextResponse.json({
    success: true,
    listings: {
      by_status: listingsByStatus,
      per_week: weeks.map(w => ({ week: w, count: listingsPerWeek[w] ?? 0 })),
      by_industry: Object.entries(listingsByIndustry).map(([name, count]) => ({ name, count })),
    },
    users: {
      total: totalUsers ?? 0,
      per_week: weeks.map(w => ({ week: w, count: signupsPerWeek[w] ?? 0 })),
      by_plan: usersByPlan,
    },
    search: { top_queries: topQueries },
    saved: { top_listings: topSaved },
  })
}
