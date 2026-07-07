'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts'
import AdminCard from '@/components/rigburrito/AdminCard'
import TableSkeleton from '@/components/rigburrito/TableSkeleton'
import ErrorState from '@/components/rigburrito/ErrorState'
import { PLAN_BAR_COLORS, PLAN_LABELS, ANALYTICS_PLAN_ORDER, listingStatusBarColor } from '@/lib/rigburrito/chartColors'
import { truncateText } from '@/lib/rigburrito/utils'
import type { MembershipPlan } from '@/lib/types/database'

const COLORS = ['#FF6B35', '#0F1117', '#16A34A', '#D97706', '#6B7280', '#9CA3AF']

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState<Record<string, unknown> | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/rigburrito/analytics')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) return <div><h1 className="rigburrito-page-title">Platform Analytics</h1><TableSkeleton rows={6} cols={2} /></div>
  if (error || !data) return <ErrorState message={error || 'No data'} onRetry={fetchData} />

  const listings = data.listings as {
    by_status: Record<string, number>
    per_week: { week: string; count: number }[]
    by_industry: { name: string; count: number }[]
  }
  const users = data.users as {
    total: number
    per_week: { week: string; count: number }[]
    by_plan: Record<string, number>
  }
  const search = data.search as { top_queries: { query: string; count: number }[] }
  const saved = data.saved as { top_listings: { listing_id: string; title: string; slug: string | null; seller: string; count: number }[] }

  const planData = ANALYTICS_PLAN_ORDER.map(plan => ({
    name: PLAN_LABELS[plan],
    plan,
    count: users.by_plan[plan] ?? 0,
  }))
  const statusData = Object.entries(listings.by_status).map(([name, count]) => ({ name, count }))

  return (
    <div>
      <h1 className="rigburrito-page-title">Platform Analytics</h1>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AdminCard>
          <h2 className="rigburrito-section-title">Listings by Status</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F1F3" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} />
              <Tooltip />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {statusData.map(entry => (
                  <Cell key={entry.name} fill={listingStatusBarColor(entry.name)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </AdminCard>

        <AdminCard>
          <h2 className="rigburrito-section-title">New Listings per Week</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={listings.per_week}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F1F3" />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#6B7280' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#FF6B35" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </AdminCard>

        <AdminCard>
          <h2 className="rigburrito-section-title">Listings by Industry</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={listings.by_industry} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name }) => name}>
                {listings.by_industry.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </AdminCard>

        <AdminCard>
          <h2 className="rigburrito-section-title">Users — Total: <span className="rigburrito-mono">{users.total}</span></h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={users.per_week}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F1F3" />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#6B7280' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#0F1117" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </AdminCard>

        <AdminCard>
          <h2 className="rigburrito-section-title">Users by Plan</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={planData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F1F3" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} />
              <Tooltip />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {planData.map(entry => (
                  <Cell key={entry.plan} fill={PLAN_BAR_COLORS[entry.plan as MembershipPlan]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </AdminCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AdminCard>
          <h2 className="rigburrito-section-title">Top Search Queries</h2>
          <ol className="space-y-2">
            {search.top_queries.map((q, i) => (
              <li key={q.query} className="flex items-center justify-between rigburrito-body">
                <span><span className="rigburrito-mono rigburrito-caption mr-2">{i + 1}.</span>{q.query}</span>
                <span className="rigburrito-mono font-medium">{q.count}</span>
              </li>
            ))}
          </ol>
        </AdminCard>

        <AdminCard>
          <h2 className="rigburrito-section-title">Top Saved Listings</h2>
          <ol className="space-y-2">
            {saved.top_listings.map((l, i) => (
              <li key={l.listing_id} className="flex items-center justify-between rigburrito-body">
                <div className="min-w-0 flex-1 pr-4">
                  <span className="rigburrito-mono rigburrito-caption mr-2">{i + 1}.</span>
                  {l.slug ? (
                    <a
                      href={`/listings/${l.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rigburrito-text-link font-medium hover:text-[#FF6B35]"
                      style={{ color: '#0F1117' }}
                      title={l.title}
                    >
                      {truncateText(l.title, 40)}
                    </a>
                  ) : (
                    <span className="font-medium" title={l.title}>{truncateText(l.title, 40)}</span>
                  )}
                  <span className="rigburrito-caption ml-2" style={{ color: '#6B7280' }}>{l.seller}</span>
                </div>
                <span className="rigburrito-mono shrink-0 font-medium">{l.count}</span>
              </li>
            ))}
          </ol>
        </AdminCard>
      </div>
    </div>
  )
}
