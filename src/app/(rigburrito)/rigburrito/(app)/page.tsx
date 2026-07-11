'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Inbox } from 'lucide-react'
import * as Tabs from '@radix-ui/react-tabs'
import StatCard from '@/components/rigburrito/StatCard'
import DashboardTrendChart from '@/components/rigburrito/DashboardTrendChart'
import DashboardGeoBreakdown from '@/components/rigburrito/DashboardGeoBreakdown'
import ExpandableDataTable, {
  type ExpandableTableAction,
  type ExpandableTableColumn,
  type ExpandableTableDetailField,
  type ExpandableTableDetailSection,
} from '@/components/rigburrito/ExpandableDataTable'
import AdminListingsModerationTable from '@/components/rigburrito/AdminListingsModerationTable'
import {
  AgentActivityFeedback,
  AgentActivitySummary,
  AgentConfidenceValue,
  AgentListingViewLink,
  AgentNamePill,
  AgentOutcomePill,
} from '@/components/rigburrito/AgentActivityCells'
import AgentActivityDateRangeControl from '@/components/rigburrito/AgentActivityDateRange'
import ListingPreviewSlideOver from '@/components/rigburrito/ListingPreviewSlideOver'
import TableSkeleton from '@/components/rigburrito/TableSkeleton'
import ErrorState from '@/components/rigburrito/ErrorState'
import EmptyState from '@/components/rigburrito/EmptyState'
import StatusBadge from '@/components/rigburrito/StatusBadge'
import PlanBadge from '@/components/rigburrito/PlanBadge'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/rigburrito/utils'
import type { DashboardStats } from '@/lib/rigburrito/types'
import type { AdminListingRow } from '@/lib/rigburrito/types'
import type { MetricHistoryPoint, MetricKey } from '@/lib/rigburrito/dashboardHistory'
import type { GeoCountryRow } from '@/components/rigburrito/WorldChoroplethMap'
import { useIsBelowLg } from '@/hooks/useIsBelowLg'

type DashboardTab =
  | 'pending_approvals'
  | 'agent_activity'
  | 'yellow_red_leads'
  | 'membership_activity'

import type { AgentActivityRow } from '@/lib/rigburrito/agentActivity'
import { parseScoreBreakdown, resolveAgentConfidence } from '@/lib/rigburrito/agentActivity'
import {
  DEFAULT_AGENT_ACTIVITY_RANGE,
  loadStoredAgentActivityRange,
  storeAgentActivityRange,
  type AgentActivityDateRange,
} from '@/lib/rigburrito/agentActivityDateRange'

interface YellowRedLeadRow {
  id: string
  buyer_name: string
  buyer_email: string
  status: string
  tier: string | null
  message: string
  listing_title: string | null
  listing_price: number | null
  listing_tier: string | null
  created_at: string
}

interface MembershipActivityRow {
  id: string
  type: 'signup' | 'cancellation'
  email: string
  full_name?: string | null
  plan: string
  created_at: string
}

const METRIC_LABELS: Record<MetricKey, string> = {
  total_users: 'Total Users',
  active_listings: 'Active Listings',
  user_locations: 'User Locations',
  mrr: 'MRR',
  new_signups: 'New Signups This Month',
  new_listings: 'New Listings This Month',
}

const TABS: { id: DashboardTab; label: string }[] = [
  { id: 'pending_approvals', label: 'Pending Approvals' },
  { id: 'agent_activity', label: 'Agent Activity' },
  { id: 'yellow_red_leads', label: 'Yellow/Red Listing Leads' },
  { id: 'membership_activity', label: 'Membership Activity' },
]

export default function DashboardPage() {
  const router = useRouter()
  const isBelowLg = useIsBelowLg()

  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [metricHistory, setMetricHistory] = useState<Record<string, MetricHistoryPoint[]>>({})
  const [historyNotes, setHistoryNotes] = useState<Record<string, string>>({})
  const [userLocationsFull, setUserLocationsFull] = useState<GeoCountryRow[]>([])
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('total_users')
  const [activeTab, setActiveTab] = useState<DashboardTab>('pending_approvals')
  const [tabRows, setTabRows] = useState<unknown[]>([])
  const [pendingListings, setPendingListings] = useState<AdminListingRow[]>([])
  const [pendingLoading, setPendingLoading] = useState(true)
  const [pendingError, setPendingError] = useState('')
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [tabLoading, setTabLoading] = useState(true)
  const [error, setError] = useState('')
  const [tabError, setTabError] = useState('')
  const [previewListingId, setPreviewListingId] = useState<string | null>(null)
  const [agentActivityRange, setAgentActivityRange] = useState<AgentActivityDateRange>(
    DEFAULT_AGENT_ACTIVITY_RANGE,
  )

  const fetchDashboard = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/rigburrito/dashboard')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to load')
      setStats(data.stats)
      setMetricHistory(data.metric_history ?? {})
      setHistoryNotes(data.metric_history_notes ?? {})
      setUserLocationsFull(data.user_locations_full ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchPendingListings = useCallback(async () => {
    setPendingLoading(true)
    setPendingError('')
    try {
      const res = await fetch('/api/rigburrito/listings?tab=pending&page=1')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to load pending listings')
      setPendingListings(data.listings ?? [])
    } catch (err) {
      setPendingError(err instanceof Error ? err.message : 'Failed to load pending listings')
      setPendingListings([])
    } finally {
      setPendingLoading(false)
    }
  }, [])

  const fetchTab = useCallback(async (tab: DashboardTab, activityRange?: AgentActivityDateRange) => {
    if (tab === 'pending_approvals') {
      await fetchPendingListings()
      return
    }

    setTabLoading(true)
    setTabError('')
    setExpandedRowId(null)
    try {
      const params = new URLSearchParams({ tab })
      if (tab === 'agent_activity') {
        params.set('range', activityRange ?? agentActivityRange)
      }

      const res = await fetch(`/api/rigburrito/dashboard/tabs?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to load tab data')
      setTabRows(data.rows ?? [])
    } catch (err) {
      setTabError(err instanceof Error ? err.message : 'Failed to load tab data')
      setTabRows([])
    } finally {
      setTabLoading(false)
    }
  }, [fetchPendingListings, agentActivityRange])

  useEffect(() => {
    const storedRange = loadStoredAgentActivityRange()
    if (storedRange) setAgentActivityRange(storedRange)
  }, [])

  useEffect(() => { fetchDashboard() }, [fetchDashboard])
  useEffect(() => {
    fetchTab(activeTab, activeTab === 'agent_activity' ? agentActivityRange : undefined)
  }, [activeTab, agentActivityRange, fetchTab])

  function handleAgentActivityRangeChange(range: AgentActivityDateRange) {
    storeAgentActivityRange(range)
    setAgentActivityRange(range)
  }

  function selectMetric(key: MetricKey) {
    setSelectedMetric(key)
  }

  const userLocationsTotal = useMemo(
    () => userLocationsFull.reduce((sum, row) => sum + row.count, 0),
    [userLocationsFull],
  )

  async function leadAction(id: string, action: 'approve' | 'commission' | 'discard') {
    const res = await fetch(`/api/rigburrito/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.error ?? 'Action failed')
    }
    if (action === 'commission' && data.deal?.id) {
      router.push(`/rigburrito/deals?highlight=${data.deal.id}`)
    }
    await fetchTab(activeTab)
  }

  const agentColumns: ExpandableTableColumn<AgentActivityRow>[] = [
    { key: 'agent', header: 'Agent', render: r => <AgentNamePill agentName={r.agent_name} /> },
    {
      key: 'view',
      header: 'View',
      render: r => <AgentListingViewLink row={r} onView={setPreviewListingId} />,
    },
    { key: 'outcome', header: 'Outcome', render: r => <AgentOutcomePill outcome={r.outcome} /> },
    { key: 'confidence', header: 'Confidence', render: r => <AgentConfidenceValue score={resolveAgentConfidence(r)} /> },
    {
      key: 'summary',
      header: 'Summary',
      className: 'rigburrito-agent-summary-cell',
      render: r => <AgentActivitySummary row={r} truncate={120} />,
    },
    { key: 'when', header: 'When', render: r => formatDate(r.created_at) },
  ]

  const agentDetails: ExpandableTableDetailField<AgentActivityRow>[] = [
    { label: 'Summary', render: r => <AgentActivitySummary row={r} /> },
    { label: 'Entity', render: r => `${r.entity_type ?? '—'} · ${r.entity_id ?? '—'}` },
    { label: 'Outcome', render: r => <AgentOutcomePill outcome={r.outcome} /> },
    { label: 'Timestamp', render: r => formatDateTime(r.created_at) },
  ]

  const agentDetailSections: ExpandableTableDetailSection<AgentActivityRow>[] = [
    { render: r => <AgentActivityFeedback row={r} /> },
  ]

  const leadColumns: ExpandableTableColumn<YellowRedLeadRow>[] = [
    { key: 'tier', header: 'Tier', render: r => <StatusBadge status={r.listing_tier ?? r.tier ?? 'yellow'} variant="deal" /> },
    { key: 'listing', header: 'Listing', render: r => r.listing_title ?? '—' },
    { key: 'buyer', header: 'Buyer', render: r => r.buyer_name },
    { key: 'status', header: 'Status', render: r => <StatusBadge status={r.status} /> },
    { key: 'received', header: 'Received', render: r => formatDate(r.created_at) },
  ]

  const leadDetails: ExpandableTableDetailField<YellowRedLeadRow>[] = [
    { label: 'Email', render: r => r.buyer_email },
    { label: 'Message', render: r => r.message },
    { label: 'Listing price', render: r => r.listing_price != null ? formatCurrency(r.listing_price) : '—' },
  ]

  const leadActions: ExpandableTableAction<YellowRedLeadRow>[] = [
    { label: 'Approve to seller', variant: 'success', onClick: r => leadAction(r.id, 'approve') },
    {
      label: 'Discard',
      variant: 'warning',
      holdToConfirm: true,
      holdMs: 3000,
      onClick: r => leadAction(r.id, 'discard'),
    },
    { label: 'Assign to ops', variant: 'secondary', onClick: r => leadAction(r.id, 'commission') },
  ]

  const membershipColumns: ExpandableTableColumn<MembershipActivityRow>[] = [
    { key: 'type', header: 'Event', render: r => r.type === 'signup' ? 'Signup' : 'Cancellation' },
    { key: 'user', header: 'User', render: r => r.full_name ?? r.email },
    { key: 'plan', header: 'Plan', render: r => <PlanBadge plan={r.plan as 'free' | 'starter' | 'pro' | 'max'} /> },
    { key: 'when', header: 'When', render: r => formatDate(r.created_at) },
  ]

  const membershipDetails: ExpandableTableDetailField<MembershipActivityRow>[] = [
    { label: 'Email', render: r => r.email },
    { label: 'Event type', render: r => (r.type === 'signup' ? 'New signup' : 'Subscription canceled') },
    { label: 'Timestamp', render: r => formatDateTime(r.created_at) },
  ]

  const membershipActions: ExpandableTableAction<MembershipActivityRow>[] = [
    {
      label: 'View account',
      variant: 'secondary',
      onClick: r => {
        if (r.type === 'signup') router.push(`/rigburrito/users/${r.id}`)
        else router.push('/rigburrito/revenue')
      },
    },
    {
      label: 'Reach out',
      variant: 'muted',
      onClick: r => { window.location.href = `mailto:${r.email}` },
    },
  ]

  if (loading) {
    return (
      <div>
        <h1 className="rigburrito-page-title">Dashboard</h1>
        <div className={`rigburrito-metric-strip ${isBelowLg ? 'rigburrito-metric-strip--stacked' : ''}`}>
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

  if (error) return <ErrorState message={error} onRetry={fetchDashboard} />

  const metrics: { key: MetricKey; value: string; trendPct: number | null }[] = [
    { key: 'total_users', value: String(stats?.total_users ?? 0), trendPct: stats?.users_trend_pct ?? null },
    { key: 'active_listings', value: String(stats?.active_listings ?? 0), trendPct: stats?.active_listings_trend_pct ?? null },
    { key: 'user_locations', value: String(userLocationsTotal), trendPct: null },
    { key: 'mrr', value: formatCurrency(stats?.mrr ?? 0), trendPct: stats?.mrr_trend_pct ?? null },
    { key: 'new_signups', value: String(stats?.new_signups_month ?? 0), trendPct: stats?.signups_trend_pct ?? null },
    { key: 'new_listings', value: String(stats?.new_listings_month ?? 0), trendPct: stats?.listings_trend_pct ?? null },
  ]

  return (
    <div>
      <h1 className="rigburrito-page-title">Dashboard</h1>

      <div className={`rigburrito-metric-strip ${isBelowLg ? 'rigburrito-metric-strip--stacked' : ''}`}>
        {metrics.map(metric => (
          <StatCard
            key={metric.key}
            label={METRIC_LABELS[metric.key]}
            value={metric.value}
            trendPct={metric.trendPct}
            selectable
            selected={selectedMetric === metric.key}
            onClick={() => selectMetric(metric.key)}
          />
        ))}
      </div>

      {selectedMetric !== 'user_locations' && metricHistory[selectedMetric] && (
        <DashboardTrendChart
          title={METRIC_LABELS[selectedMetric]}
          data={metricHistory[selectedMetric]}
          valueFormatter={
            selectedMetric === 'mrr'
              ? v => formatCurrency(v)
              : v => String(v)
          }
          note={historyNotes[selectedMetric]}
        />
      )}

      {selectedMetric === 'user_locations' && (
        <DashboardGeoBreakdown locations={userLocationsFull} title={METRIC_LABELS.user_locations} />
      )}

      <Tabs.Root value={activeTab} onValueChange={v => setActiveTab(v as DashboardTab)}>
        <Tabs.List className="rigburrito-tab-bar" aria-label="Dashboard sections">
          {TABS.map(tab => (
            <Tabs.Trigger key={tab.id} value={tab.id} className="rigburrito-tab-bar-trigger">
              {tab.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="pending_approvals" className="rigburrito-tab-panel">
          <AdminListingsModerationTable
            listings={pendingListings}
            mode="pending"
            loading={pendingLoading}
            error={pendingError}
            onRetry={fetchPendingListings}
            onRefresh={fetchPendingListings}
            emptyTitle="No pending approvals"
            emptyDescription="Listings awaiting admin review will appear here."
          />
        </Tabs.Content>

        <Tabs.Content value="agent_activity" className="rigburrito-tab-panel">
          <AgentActivityDateRangeControl
            value={agentActivityRange}
            onChange={handleAgentActivityRangeChange}
          />
          {tabLoading ? <TableSkeleton cols={6} /> : tabError ? (
            <ErrorState
              message={tabError}
              onRetry={() => fetchTab('agent_activity', agentActivityRange)}
            />
          ) : (
            <ExpandableDataTable
              rows={(tabRows as AgentActivityRow[]).map(row => ({
                ...row,
                score_breakdown: parseScoreBreakdown(row.score_breakdown),
              }))}
              columns={agentColumns}
              detailFields={agentDetails}
              detailSections={agentDetailSections}
              actions={[]}
              getRowId={r => r.id}
              expandedId={expandedRowId}
              onToggle={id => setExpandedRowId(prev => (prev === id ? null : id))}
              emptyState={
                <EmptyState icon={Inbox} title="No agent activity" description="Paperclip agent actions will be logged here." />
              }
            />
          )}
        </Tabs.Content>

        <Tabs.Content value="yellow_red_leads" className="rigburrito-tab-panel">
          {tabLoading ? <TableSkeleton cols={5} /> : tabError ? (
            <ErrorState message={tabError} onRetry={() => fetchTab('yellow_red_leads')} />
          ) : (
            <ExpandableDataTable
              rows={tabRows as YellowRedLeadRow[]}
              columns={leadColumns}
              detailFields={leadDetails}
              actions={leadActions}
              getRowId={r => r.id}
              expandedId={expandedRowId}
              onToggle={id => setExpandedRowId(prev => (prev === id ? null : id))}
              emptyState={
                <EmptyState icon={Inbox} title="No yellow or red leads" description="Classified leads will appear here." />
              }
            />
          )}
        </Tabs.Content>

        <Tabs.Content value="membership_activity" className="rigburrito-tab-panel">
          {tabLoading ? <TableSkeleton cols={4} /> : tabError ? (
            <ErrorState message={tabError} onRetry={() => fetchTab('membership_activity')} />
          ) : (
            <ExpandableDataTable
              rows={tabRows as MembershipActivityRow[]}
              columns={membershipColumns}
              detailFields={membershipDetails}
              actions={membershipActions}
              getRowId={r => r.id}
              expandedId={expandedRowId}
              onToggle={id => setExpandedRowId(prev => (prev === id ? null : id))}
              emptyState={
                <EmptyState icon={Inbox} title="No membership activity" description="Recent signups and cancellations will appear here." />
              }
            />
          )}
        </Tabs.Content>
      </Tabs.Root>

      <ListingPreviewSlideOver
        listingId={previewListingId}
        onClose={() => setPreviewListingId(null)}
      />
    </div>
  )
}
