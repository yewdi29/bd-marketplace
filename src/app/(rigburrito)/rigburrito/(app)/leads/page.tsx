'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import * as Tabs from '@radix-ui/react-tabs'
import * as Dialog from '@radix-ui/react-dialog'
import { CheckCircle, DollarSign, Inbox, X, XCircle } from 'lucide-react'
import AdminButton from '@/components/rigburrito/AdminButton'
import EmptyState from '@/components/rigburrito/EmptyState'
import ErrorState from '@/components/rigburrito/ErrorState'
import HoldToConfirmButton from '@/components/rigburrito/HoldToConfirmButton'
import Pagination from '@/components/rigburrito/Pagination'
import SlideOver from '@/components/rigburrito/SlideOver'
import StatusBadge from '@/components/rigburrito/StatusBadge'
import TableSkeleton from '@/components/rigburrito/TableSkeleton'
import { formatAdminTablePrice } from '@/lib/formatPrice'
import { formatDate, formatRelativeTime, truncateText } from '@/lib/rigburrito/utils'
import type { AdminLeadRow } from '@/lib/rigburrito/types'

const LEAD_STATUSES = [
  { value: '', label: 'All statuses' },
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'new', label: 'New' },
  { value: 'forwarded', label: 'Forwarded' },
  { value: 'denied', label: 'Denied' },
  { value: 'commission_opportunity', label: 'Commission Opportunity' },
]

const TIER_FILTERS = [
  { value: '', label: 'All tiers' },
  { value: 'green', label: 'Green' },
  { value: 'yellow', label: 'Yellow' },
  { value: 'red', label: 'Red' },
]

function TierPill({ tier }: { tier: string | null }) {
  if (!tier || tier === 'green') return null
  const isYellow = tier === 'yellow'
  return (
    <span
      style={{
        borderRadius: 999,
        padding: '4px 12px',
        fontSize: 11,
        fontWeight: 600,
        color: isYellow ? '#D97706' : '#DC2626',
        background: isYellow ? '#FFFBEB' : '#FEF2F2',
        border: `1px solid ${isYellow ? '#FDE68A' : '#FECACA'}`,
      }}
    >
      {isYellow ? 'Yellow' : 'Red'}
    </span>
  )
}

function LeadActions({
  lead,
  onAction,
  acting,
}: {
  lead: AdminLeadRow
  onAction: (action: 'approve' | 'deny' | 'commission', form?: CommissionForm) => void
  acting: boolean
}) {
  const [approveOpen, setApproveOpen] = useState(false)
  const [commissionOpen, setCommissionOpen] = useState(false)
  const [commissionForm, setCommissionForm] = useState<CommissionForm>(() => ({
    deal_tier: (lead.listing_tier === 'red' ? 'red' : 'yellow') as 'yellow' | 'red',
    buyer_name: lead.buyer_name,
    buyer_email: lead.buyer_email,
    buyer_phone: lead.buyer_phone ?? '',
    asking_price: String(lead.listing_price ?? ''),
    commission_rate: '7',
  }))

  if (lead.status !== 'pending_review') return null

  return (
    <div className="flex flex-wrap gap-2 pt-4 border-t" style={{ borderColor: '#F0F1F3' }}>
      <AdminButton variant="success" disabled={acting} onClick={() => setApproveOpen(true)}>
        <CheckCircle size={14} strokeWidth={2} />
        Approve &amp; Forward
      </AdminButton>
      <HoldToConfirmButton
        label="Deny"
        icon={<XCircle size={14} strokeWidth={2} />}
        holdLabel="Hold to deny..."
        disabled={acting}
        onConfirm={() => onAction('deny')}
      />
      <AdminButton variant="warning" disabled={acting} onClick={() => setCommissionOpen(true)}>
        <DollarSign size={14} strokeWidth={2} />
        Commission Opportunity
      </AdminButton>

      <Dialog.Root open={approveOpen} onOpenChange={setApproveOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50" style={{ background: 'rgba(0,0,0,0.4)' }} />
          <Dialog.Content className="rigburrito-card fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 p-6 outline-none" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
            <Dialog.Title className="rigburrito-section-title" style={{ marginBottom: 8 }}>Forward to seller?</Dialog.Title>
            <p className="rigburrito-body mb-6" style={{ color: '#6B7280' }}>Forward this inquiry to the seller? They will receive the buyer&apos;s full contact details.</p>
            <div className="flex gap-2 justify-end">
              <AdminButton variant="muted" onClick={() => setApproveOpen(false)}>Cancel</AdminButton>
              <AdminButton variant="success" disabled={acting} onClick={() => { setApproveOpen(false); onAction('approve') }}>
                Confirm
              </AdminButton>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={commissionOpen} onOpenChange={setCommissionOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50" style={{ background: 'rgba(0,0,0,0.4)' }} />
          <Dialog.Content className="rigburrito-card fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto p-6 outline-none" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
            <div className="mb-4 flex items-center justify-between">
              <Dialog.Title className="rigburrito-section-title" style={{ marginBottom: 0 }}>Commission Opportunity</Dialog.Title>
              <Dialog.Close asChild><button type="button" className="rigburrito-btn-icon"><X size={16} /></button></Dialog.Close>
            </div>
            <p className="rigburrito-caption mb-4">{lead.listing_title} — {lead.buyer_name}</p>
            <select
              value={commissionForm.deal_tier}
              onChange={e => setCommissionForm(f => ({ ...f, deal_tier: e.target.value as 'yellow' | 'red' }))}
              className="rigburrito-select mb-3 w-full"
            >
              <option value="yellow">Yellow ($100K–$500K)</option>
              <option value="red">Red ($500K+)</option>
            </select>
            {(['buyer_name', 'buyer_email', 'buyer_phone'] as const).map(field => (
              <input
                key={field}
                placeholder={field.replace(/_/g, ' ')}
                value={commissionForm[field]}
                onChange={e => setCommissionForm(f => ({ ...f, [field]: e.target.value }))}
                className="rigburrito-input mb-3 w-full"
              />
            ))}
            <input
              type="number"
              placeholder="Asking price"
              value={commissionForm.asking_price}
              onChange={e => setCommissionForm(f => ({ ...f, asking_price: e.target.value }))}
              className="rigburrito-input rigburrito-mono mb-3 w-full"
            />
            <input
              type="number"
              placeholder="Commission rate %"
              value={commissionForm.commission_rate}
              onChange={e => setCommissionForm(f => ({ ...f, commission_rate: e.target.value }))}
              className="rigburrito-input rigburrito-mono mb-4 w-full"
            />
            <HoldToConfirmButton
              label="Create Deal & Update Lead"
              variant="warning"
              holdLabel="Hold to create deal..."
              disabled={acting}
              onConfirm={() => {
                setCommissionOpen(false)
                onAction('commission', commissionForm)
              }}
            />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}

interface CommissionForm {
  deal_tier: 'yellow' | 'red'
  buyer_name: string
  buyer_email: string
  buyer_phone: string
  asking_price: string
  commission_rate: string
}

function PendingLeadCard({
  lead,
  onAction,
  acting,
}: {
  lead: AdminLeadRow
  onAction: (leadId: string, action: 'approve' | 'deny' | 'commission', form?: CommissionForm) => void
  acting: boolean
}) {
  return (
    <div className="rigburrito-card" style={{ padding: 20 }}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="rigburrito-mono rigburrito-body font-medium">{lead.listing_title ?? '—'}</p>
          <p className="rigburrito-mono rigburrito-caption mt-1" style={{ color: '#6B7280' }}>
            {lead.listing_price != null
              ? formatAdminTablePrice(lead.listing_price, lead.listing_price_unit ?? 'total', true)
              : '—'}
          </p>
        </div>
        <TierPill tier={lead.listing_tier ?? lead.tier} />
      </div>

      <div className="mb-3 space-y-1">
        <p className="rigburrito-body"><strong>{lead.buyer_name}</strong></p>
        <p className="rigburrito-body" style={{ color: '#6B7280' }}>{lead.buyer_email}</p>
        {lead.buyer_phone && <p className="rigburrito-body" style={{ color: '#6B7280' }}>{lead.buyer_phone}</p>}
        {lead.buyer_company && <p className="rigburrito-body" style={{ color: '#6B7280' }}>{lead.buyer_company}</p>}
      </div>

      <div
        style={{
          background: '#F8F9FA',
          borderLeft: '4px solid #FF6B35',
          borderRadius: 8,
          padding: '12px 16px',
          marginBottom: 12,
        }}
      >
        <p className="rigburrito-body whitespace-pre-wrap" style={{ fontSize: 14, lineHeight: 1.7 }}>{lead.message}</p>
      </div>

      <p className="rigburrito-caption mb-0" style={{ color: '#9CA3AF' }}>{formatRelativeTime(lead.created_at)}</p>

      <LeadActions
        lead={lead}
        acting={acting}
        onAction={(action, form) => onAction(lead.id, action, form)}
      />
    </div>
  )
}

export default function LeadsPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'pending' | 'all'>('pending')
  const [leads, setLeads] = useState<AdminLeadRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [tierFilter, setTierFilter] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selected, setSelected] = useState<AdminLeadRow | null>(null)
  const [acting, setActing] = useState(false)

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    setError('')
    const params = new URLSearchParams({ tab })
    if (tab === 'all') {
      params.set('page', String(page))
      if (statusFilter) params.set('status', statusFilter)
      if (tierFilter) params.set('tier', tierFilter)
      if (search) params.set('search', search)
    }
    try {
      const res = await fetch(`/api/rigburrito/leads?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setLeads(data.leads)
      setTotalPages(data.total_pages ?? 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leads')
    } finally {
      setLoading(false)
    }
  }, [tab, page, statusFilter, tierFilter, search])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  async function handleAction(
    leadId: string,
    action: 'approve' | 'deny' | 'commission',
    form?: CommissionForm,
  ) {
    setActing(true)
    try {
      const body: Record<string, unknown> = { action }
      if (action === 'commission' && form) {
        body.deal_tier = form.deal_tier
        body.buyer_name = form.buyer_name
        body.buyer_email = form.buyer_email
        body.buyer_phone = form.buyer_phone || null
        body.asking_price = parseFloat(form.asking_price) || null
        body.commission_rate = parseFloat(form.commission_rate) || 7
      }
      const res = await fetch(`/api/rigburrito/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setSelected(null)
      await fetchLeads()

      if (action === 'commission' && data.deal?.id) {
        router.push(`/rigburrito/deals?highlight=${data.deal.id}`)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setActing(false)
    }
  }

  return (
    <div>
      <h1 className="rigburrito-page-title">Leads</h1>

      <Tabs.Root value={tab} onValueChange={v => { setTab(v as 'pending' | 'all'); setPage(1) }}>
        <Tabs.List className="mb-4 flex gap-2">
          <Tabs.Trigger value="pending" className="rigburrito-tab">Pending Review</Tabs.Trigger>
          <Tabs.Trigger value="all" className="rigburrito-tab">All Leads</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="pending">
          {loading ? (
            <TableSkeleton />
          ) : error ? (
            <ErrorState message={error} onRetry={fetchLeads} />
          ) : leads.length === 0 ? (
            <EmptyState icon={Inbox} title="No pending leads" description="Inquiries requiring review will appear here." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {leads.map(lead => (
                <PendingLeadCard
                  key={lead.id}
                  lead={lead}
                  acting={acting}
                  onAction={handleAction}
                />
              ))}
            </div>
          )}
        </Tabs.Content>

        <Tabs.Content value="all">
          <div className="mb-4 flex flex-wrap gap-3">
            <input
              type="search"
              placeholder="Search buyer name or email..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="rigburrito-input"
              style={{ minWidth: 240 }}
            />
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }} className="rigburrito-select">
              {LEAD_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <select value={tierFilter} onChange={e => { setTierFilter(e.target.value); setPage(1) }} className="rigburrito-select">
              {TIER_FILTERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          {loading ? <TableSkeleton /> : error ? <ErrorState message={error} onRetry={fetchLeads} /> : (
            <div className="rigburrito-table-wrap rigburrito-table-wrap--scroll">
              {leads.length === 0 ? (
                <EmptyState icon={Inbox} title="No leads found" description="Try adjusting your filters." />
              ) : (
                <table className="rigburrito-table rigburrito-table--data">
                  <thead>
                    <tr>
                      {['Tier', 'Listing', 'Buyer', 'Email', 'Message', 'Status', 'Received'].map(h => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map(lead => (
                      <tr
                        key={lead.id}
                        className="rigburrito-table-row--clickable"
                        onClick={() => setSelected(lead)}
                      >
                        <td><StatusBadge status={lead.listing_tier ?? lead.tier ?? 'green'} variant="deal" /></td>
                        <td className="font-medium">{lead.listing_title ?? '—'}</td>
                        <td>{lead.buyer_name}</td>
                        <td style={{ color: '#6B7280' }}>{lead.buyer_email}</td>
                        <td style={{ color: '#6B7280', maxWidth: 200 }}>{truncateText(lead.message, 60)}</td>
                        <td><StatusBadge status={lead.status} /></td>
                        <td style={{ color: '#6B7280' }}>{formatDate(lead.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div className="px-4 pb-4"><Pagination page={page} totalPages={totalPages} onPageChange={setPage} /></div>
            </div>
          )}
        </Tabs.Content>
      </Tabs.Root>

      <SlideOver
        open={!!selected}
        onOpenChange={o => !o && setSelected(null)}
        title="Lead Details"
        width="520px"
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="rigburrito-card-label">Listing</p>
                <p className="rigburrito-mono rigburrito-body mt-1 font-medium">{selected.listing_title ?? '—'}</p>
                {selected.listing_price != null && (
                  <p className="rigburrito-mono rigburrito-caption mt-1" style={{ color: '#6B7280' }}>
                    {formatAdminTablePrice(selected.listing_price, selected.listing_price_unit ?? 'total', true)}
                  </p>
                )}
              </div>
              <TierPill tier={selected.listing_tier ?? selected.tier} />
            </div>
            <div>
              <p className="rigburrito-card-label">Buyer</p>
              <p className="rigburrito-body mt-1">{selected.buyer_name}</p>
              <p className="rigburrito-body" style={{ color: '#6B7280' }}>{selected.buyer_email}</p>
              {selected.buyer_phone && <p className="rigburrito-body" style={{ color: '#6B7280' }}>{selected.buyer_phone}</p>}
              {selected.buyer_company && <p className="rigburrito-body" style={{ color: '#6B7280' }}>{selected.buyer_company}</p>}
            </div>
            <div>
              <p className="rigburrito-card-label">Message</p>
              <div
                className="mt-2"
                style={{
                  background: '#F8F9FA',
                  borderLeft: '4px solid #FF6B35',
                  borderRadius: 8,
                  padding: '12px 16px',
                }}
              >
                <p className="rigburrito-body whitespace-pre-wrap">{selected.message}</p>
              </div>
            </div>
            <div>
              <p className="rigburrito-card-label">Status</p>
              <StatusBadge status={selected.status} />
            </div>
            <p className="rigburrito-caption" style={{ color: '#9CA3AF' }}>Received {formatRelativeTime(selected.created_at)}</p>
            <LeadActions
              lead={selected}
              acting={acting}
              onAction={(action, form) => handleAction(selected.id, action, form)}
            />
          </div>
        )}
      </SlideOver>
    </div>
  )
}
