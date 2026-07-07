'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Inbox } from 'lucide-react'
import StatCard from '@/components/rigburrito/StatCard'
import UserLocationsCard from '@/components/rigburrito/UserLocationsCard'
import type { UserLocationRow } from '@/components/rigburrito/UserLocationsCard'
import AdminCard from '@/components/rigburrito/AdminCard'
import TableSkeleton from '@/components/rigburrito/TableSkeleton'
import ErrorState from '@/components/rigburrito/ErrorState'
import EmptyState from '@/components/rigburrito/EmptyState'
import { formatCurrency, formatDate } from '@/lib/rigburrito/utils'
import type { DashboardStats } from '@/lib/rigburrito/types'
import PlanBadge from '@/components/rigburrito/PlanBadge'
import StatusBadge from '@/components/rigburrito/StatusBadge'
import type { MembershipPlan } from '@/lib/types/database'

interface RecentUser {
  id: string
  full_name: string | null
  email: string
  plan: MembershipPlan
  created_at: string
}

interface PendingListing {
  id: string
  title: string
  status: string
  price: number
  created_at: string
  seller_name: string
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([])
  const [pendingListings, setPendingListings] = useState<PendingListing[]>([])
  const [userLocations, setUserLocations] = useState<UserLocationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/rigburrito/dashboard')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to load')
      setStats(data.stats)
      setRecentUsers(data.recent_users)
      setPendingListings(data.pending_listings)
      setUserLocations(data.user_locations ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) {
    return (
      <div>
        <h1 className="rigburrito-page-title">Dashboard</h1>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rigburrito-stat-card">
              <div className="rigburrito-skeleton" style={{ height: 10, width: '40%', marginBottom: 12 }} />
              <div className="rigburrito-skeleton" style={{ height: 32, width: '60%' }} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) return <ErrorState message={error} onRetry={fetchData} />

  return (
    <div>
      <h1 className="rigburrito-page-title">Dashboard</h1>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total Users" value={String(stats?.total_users ?? 0)} trendPct={stats?.users_trend_pct} />
        <StatCard label="Active Listings" value={String(stats?.active_listings ?? 0)} trendPct={stats?.active_listings_trend_pct} />
        <UserLocationsCard locations={userLocations} />
        <StatCard label="MRR" value={formatCurrency(stats?.mrr ?? 0)} trendPct={stats?.mrr_trend_pct} showSparkline={stats?.mrr_trend_pct != null} />
        <StatCard label="New Signups This Month" value={String(stats?.new_signups_month ?? 0)} trendPct={stats?.signups_trend_pct} />
        <StatCard label="New Listings This Month" value={String(stats?.new_listings_month ?? 0)} trendPct={stats?.listings_trend_pct} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AdminCard>
          <h2 className="rigburrito-section-title">Recent Signups</h2>
          <div className="space-y-1">
            {recentUsers.map(u => (
              <Link key={u.id} href={`/rigburrito/users/${u.id}`} className="rigburrito-list-row">
                <div>
                  <p className="rigburrito-body font-medium">{u.full_name ?? u.email}</p>
                  <p className="rigburrito-caption">{u.email}</p>
                </div>
                <div className="text-right">
                  <PlanBadge plan={u.plan} />
                  <p className="rigburrito-caption mt-1">{formatDate(u.created_at)}</p>
                </div>
              </Link>
            ))}
          </div>
        </AdminCard>

        <AdminCard>
          <h2 className="rigburrito-section-title">Pending Approval</h2>
          {pendingListings.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="All caught up"
              description="No listings awaiting approval."
            />
          ) : (
            <div className="space-y-1">
              {pendingListings.map(l => (
                <Link key={l.id} href="/rigburrito/listings" className="rigburrito-list-row">
                  <div className="min-w-0 flex-1 pr-4">
                    <p className="rigburrito-body truncate font-medium">{l.title}</p>
                    <p className="rigburrito-caption">{l.seller_name}</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={l.status} />
                    <p className="rigburrito-mono rigburrito-body mt-1 text-sm">{formatCurrency(l.price)}</p>
                    <p className="rigburrito-caption">{formatDate(l.created_at)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </AdminCard>
      </div>
    </div>
  )
}
