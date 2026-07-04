'use client'

import { useCallback, useEffect, useState } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import StatCard from '@/components/rigburrito/StatCard'
import TableSkeleton from '@/components/rigburrito/TableSkeleton'
import ErrorState from '@/components/rigburrito/ErrorState'
import PlanBadge from '@/components/rigburrito/PlanBadge'
import { formatCurrency, formatDate } from '@/lib/rigburrito/utils'
import type { MembershipPlan } from '@/lib/types/database'

interface SubRow {
  id: string
  email: string
  plan: MembershipPlan
  interval: string
  amount: number
  start_date: string
  next_billing?: string
  canceled_at?: string | null
}

export default function RevenuePage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState<Record<string, number> | null>(null)
  const [active, setActive] = useState<SubRow[]>([])
  const [canceled, setCanceled] = useState<SubRow[]>([])
  const [search, setSearch] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/rigburrito/revenue')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setStats(data.stats)
      setActive(data.active)
      setCanceled(data.canceled)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load revenue')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filter = (rows: SubRow[]) =>
    search ? rows.filter(r => r.email.toLowerCase().includes(search.toLowerCase())) : rows

  if (loading) return <div><h1 className="rigburrito-page-title">Revenue & Subscriptions</h1><TableSkeleton /></div>
  if (error) return <ErrorState message={error} onRetry={fetchData} />

  return (
    <div>
      <h1 className="rigburrito-page-title">Revenue & Subscriptions</h1>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard label="MRR" value={formatCurrency(stats?.mrr ?? 0)} showSparkline={false} />
        <StatCard label="Active Subscriptions" value={String(stats?.active_subscriptions ?? 0)} showSparkline={false} />
        <StatCard label="New This Month" value={String(stats?.new_this_month ?? 0)} showSparkline={false} />
        <StatCard label="Churned This Month" value={String(stats?.churned_this_month ?? 0)} showSparkline={false} />
        <StatCard label="Starter" value={String(stats?.starter_count ?? 0)} showSparkline={false} />
        <StatCard label="Pro / Max" value={`${stats?.pro_count ?? 0} / ${stats?.max_count ?? 0}`} showSparkline={false} />
      </div>

      <Tabs.Root defaultValue="active">
        <Tabs.List className="mb-4 flex gap-2">
          <Tabs.Trigger value="active" className="rigburrito-tab">Active</Tabs.Trigger>
          <Tabs.Trigger value="canceled" className="rigburrito-tab">Canceled (90d)</Tabs.Trigger>
        </Tabs.List>

        <input
          type="search"
          placeholder="Search email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="rigburrito-input mb-4"
          style={{ minWidth: 280 }}
        />

        <Tabs.Content value="active">
          <SubTable rows={filter(active)} type="active" />
        </Tabs.Content>
        <Tabs.Content value="canceled">
          <SubTable rows={filter(canceled)} type="canceled" />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  )
}

function SubTable({ rows, type }: { rows: SubRow[]; type: 'active' | 'canceled' }) {
  return (
    <div className="rigburrito-table-wrap">
      <table className="rigburrito-table">
        <thead>
          <tr>
            {type === 'active'
              ? ['Email', 'Plan', 'Period', 'Amount', 'Start', 'Next Billing'].map(h => <th key={h}>{h}</th>)
              : ['Email', 'Plan', 'Canceled'].map(h => <th key={h}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td>{r.email}</td>
              <td><PlanBadge plan={r.plan} /></td>
              {type === 'active' ? (
                <>
                  <td className="capitalize">{r.interval}ly</td>
                  <td className="rigburrito-mono">{formatCurrency(r.amount)}</td>
                  <td>{formatDate(r.start_date)}</td>
                  <td>{formatDate(r.next_billing ?? null)}</td>
                </>
              ) : (
                <td>{formatDate(r.canceled_at ?? null)}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
