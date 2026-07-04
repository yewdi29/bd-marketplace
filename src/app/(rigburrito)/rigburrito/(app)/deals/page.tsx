'use client'

import { useCallback, useEffect, useState } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import * as Dialog from '@radix-ui/react-dialog'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { X } from 'lucide-react'
import StatusBadge from '@/components/rigburrito/StatusBadge'
import AdminButton from '@/components/rigburrito/AdminButton'
import TableSkeleton from '@/components/rigburrito/TableSkeleton'
import ErrorState from '@/components/rigburrito/ErrorState'
import SlideOver from '@/components/rigburrito/SlideOver'
import HoldToConfirmButton from '@/components/rigburrito/HoldToConfirmButton'
import { formatCurrency, formatDate, getInitials } from '@/lib/rigburrito/utils'
import { DEAL_STATUSES, type Deal, type DealStatus } from '@/lib/rigburrito/types'

function DealCard({ deal, onClick }: { deal: Deal; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: deal.id })
  const style = transform ? { transform: `translate(${transform.x}px, ${transform.y}px)` } : undefined

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, opacity: isDragging ? 0.5 : 1 }}
      className="rigburrito-deal-card"
      {...listeners}
      {...attributes}
      onClick={onClick}
    >
      <p className="rigburrito-body mb-1 truncate font-medium">{deal.listing_title ?? 'No listing'}</p>
      <span className="mb-2 inline-block"><StatusBadge status={deal.deal_tier} variant="deal" /></span>
      <p className="rigburrito-caption" style={{ color: '#6B7280' }}>{deal.buyer_name ?? 'No buyer'}</p>
      <p className="rigburrito-mono rigburrito-body">{formatCurrency(deal.asking_price ?? 0)}</p>
      {deal.assigned_name && (
        <div className="mt-2 flex h-6 w-6 items-center justify-center rounded-full text-xs text-white" style={{ background: '#6B7280' }}>
          {getInitials(deal.assigned_name)}
        </div>
      )}
    </div>
  )
}

function KanbanColumn({ status, label, deals, onCardClick }: { status: DealStatus; label: string; deals: Deal[]; onCardClick: (d: Deal) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const columnDeals = deals.filter(d => d.status === status)

  return (
    <div
      ref={setNodeRef}
      className={`rigburrito-kanban-col${isOver ? ' rigburrito-kanban-col--over' : ''}`}
    >
      <h3 className="rigburrito-card-label mb-3">{label} ({columnDeals.length})</h3>
      {columnDeals.map(d => <DealCard key={d.id} deal={d} onClick={() => onCardClick(d)} />)}
    </div>
  )
}

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Deal | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [listings, setListings] = useState<{ id: string; title: string; price: number; seller_name: string | null }[]>([])
  const [listingSearch, setListingSearch] = useState('')
  const [form, setForm] = useState({
    listing_id: '', deal_tier: 'yellow' as 'yellow' | 'red',
    buyer_name: '', buyer_email: '', buyer_phone: '',
    commission_rate: '7', notes: '',
  })
  const [editForm, setEditForm] = useState<Partial<Deal>>({})
  const [newNote, setNewNote] = useState('')

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const fetchDeals = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/rigburrito/deals')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setDeals(data.deals)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDeals() }, [fetchDeals])

  async function searchListings(q: string) {
    setListingSearch(q)
    const res = await fetch(`/api/rigburrito/deals/listings?search=${encodeURIComponent(q)}`)
    const data = await res.json()
    setListings(data.listings ?? [])
  }

  async function createDeal() {
    const listing = listings.find(l => l.id === form.listing_id)
    const price = listing?.price ?? 0
    const tier = price >= 500000 ? 'red' : 'yellow'
    await fetch('/api/rigburrito/deals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, deal_tier: form.deal_tier || tier, commission_rate: parseFloat(form.commission_rate) }),
    })
    setDialogOpen(false)
    fetchDeals()
  }

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id))
  }

  async function handleDragEnd(e: DragEndEvent) {
    setActiveId(null)
    const dealId = String(e.active.id)
    const newStatus = e.over?.id as DealStatus | undefined
    if (!newStatus || !DEAL_STATUSES.find(s => s.id === newStatus)) return
    const deal = deals.find(d => d.id === dealId)
    if (!deal || deal.status === newStatus) return
    await fetch(`/api/rigburrito/deals/${dealId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    fetchDeals()
  }

  async function openDeal(deal: Deal) {
    setSelected(deal)
    const res = await fetch(`/api/rigburrito/deals/${deal.id}`)
    const data = await res.json()
    setEditForm(data.deal)
  }

  async function saveDeal() {
    if (!selected) return
    await fetch(`/api/rigburrito/deals/${selected.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...editForm, new_note: newNote || undefined }),
    })
    setNewNote('')
    setSelected(null)
    fetchDeals()
  }

  async function deleteDeal() {
    if (!selected) return
    await fetch(`/api/rigburrito/deals/${selected.id}`, { method: 'DELETE' })
    setSelected(null)
    fetchDeals()
  }

  const closedWon = deals.filter(d => d.status === 'closed_won')
  const totalCommission = closedWon.reduce((s, d) => s + (d.commission_earned ?? 0), 0)
  const commissionPreview = ((editForm.final_sale_price ?? 0) * (editForm.commission_rate ?? 7)) / 100

  if (loading) return <div><h1 className="rigburrito-page-title">Deal Tracker</h1><TableSkeleton /></div>
  if (error) return <ErrorState message={error} onRetry={fetchDeals} />

  const dealFooter = selected ? (
    <>
      <AdminButton variant="accent" onClick={saveDeal}>Save</AdminButton>
      <HoldToConfirmButton label="Delete Deal" onConfirm={deleteDeal} />
    </>
  ) : null

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="rigburrito-page-title" style={{ marginBottom: 0 }}>Deal Tracker</h1>
        <AdminButton variant="accent" onClick={() => { setDialogOpen(true); searchListings('') }}>New Deal</AdminButton>
      </div>

      <Tabs.Root defaultValue="board">
        <Tabs.List className="mb-4 flex gap-2">
          <Tabs.Trigger value="board" className="rigburrito-tab">Board View</Tabs.Trigger>
          <Tabs.Trigger value="closed" className="rigburrito-tab">Closed Deals</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="board">
          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex gap-3 overflow-x-auto pb-4">
              {DEAL_STATUSES.map(col => (
                <KanbanColumn key={col.id} status={col.id} label={col.label} deals={deals} onCardClick={openDeal} />
              ))}
            </div>
            <DragOverlay>
              {activeId ? (() => {
                const d = deals.find(x => x.id === activeId)
                return d ? <DealCard deal={d} onClick={() => {}} /> : null
              })() : null}
            </DragOverlay>
          </DndContext>
        </Tabs.Content>

        <Tabs.Content value="closed">
          <p className="rigburrito-mono rigburrito-stat-value mb-4" style={{ fontSize: 20 }}>Total Commission: {formatCurrency(totalCommission)}</p>
          <div className="rigburrito-table-wrap">
            <table className="rigburrito-table">
              <thead>
                <tr>
                  {['Listing', 'Buyer', 'Seller', 'Final Price', 'Rate %', 'Commission', 'Close Date'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {closedWon.map(d => (
                  <tr key={d.id}>
                    <td>{d.listing_title}</td>
                    <td>{d.buyer_name}</td>
                    <td>{d.seller_name}</td>
                    <td className="rigburrito-mono">{formatCurrency(d.final_sale_price ?? 0)}</td>
                    <td className="rigburrito-mono">{d.commission_rate}%</td>
                    <td className="rigburrito-mono">{formatCurrency(d.commission_earned ?? 0)}</td>
                    <td>{formatDate(d.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Tabs.Content>
      </Tabs.Root>

      <SlideOver open={!!selected} onOpenChange={o => !o && setSelected(null)} title="Deal Details" width="520px" footer={dealFooter}>
        {selected && (
          <div className="space-y-3">
            {(['buyer_name', 'buyer_email', 'buyer_phone', 'seller_name'] as const).map(field => (
              <div key={field}>
                <label className="rigburrito-card-label mb-1 block capitalize">{field.replace(/_/g, ' ')}</label>
                <input
                  value={String(editForm[field] ?? '')}
                  onChange={e => setEditForm(f => ({ ...f, [field]: e.target.value }))}
                  className="rigburrito-input w-full"
                />
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="rigburrito-card-label mb-1 block">Final Sale Price</label>
                <input type="number" value={editForm.final_sale_price ?? ''} onChange={e => setEditForm(f => ({ ...f, final_sale_price: parseFloat(e.target.value) || null }))} className="rigburrito-input rigburrito-mono w-full" />
              </div>
              <div>
                <label className="rigburrito-card-label mb-1 block">Commission Rate %</label>
                <input type="number" value={editForm.commission_rate ?? 7} onChange={e => setEditForm(f => ({ ...f, commission_rate: parseFloat(e.target.value) || 7 }))} className="rigburrito-input rigburrito-mono w-full" />
              </div>
            </div>
            <div>
              <label className="rigburrito-card-label mb-1 block">Commission Earned</label>
              <p className="rigburrito-mono rigburrito-stat-value" style={{ fontSize: 20 }}>{formatCurrency(commissionPreview)}</p>
            </div>
            {editForm.notes && (
              <div>
                <label className="rigburrito-card-label mb-1 block">Notes Timeline</label>
                <pre className="max-h-40 overflow-auto rounded-lg p-3 text-xs whitespace-pre-wrap rigburrito-card" style={{ padding: 12 }}>{editForm.notes}</pre>
              </div>
            )}
            <div>
              <label className="rigburrito-card-label mb-1 block">Add Note</label>
              <textarea value={newNote} onChange={e => setNewNote(e.target.value)} rows={2} className="rigburrito-textarea" />
            </div>
          </div>
        )}
      </SlideOver>

      <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50" style={{ background: 'rgba(0,0,0,0.4)' }} />
          <Dialog.Content className="rigburrito-card fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto outline-none" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
            <div className="mb-4 flex items-center justify-between">
              <Dialog.Title className="rigburrito-section-title" style={{ marginBottom: 0 }}>New Deal</Dialog.Title>
              <Dialog.Close asChild><button type="button" className="rigburrito-btn-icon"><X size={16} /></button></Dialog.Close>
            </div>
            <input placeholder="Search listings..." value={listingSearch} onChange={e => searchListings(e.target.value)} className="rigburrito-input mb-2 w-full" />
            <select value={form.listing_id} onChange={e => setForm(f => ({ ...f, listing_id: e.target.value }))} className="rigburrito-select mb-4 w-full">
              <option value="">Select listing</option>
              {listings.map(l => <option key={l.id} value={l.id}>{l.title} — {formatCurrency(l.price)}</option>)}
            </select>
            <select value={form.deal_tier} onChange={e => setForm(f => ({ ...f, deal_tier: e.target.value as 'yellow' | 'red' }))} className="rigburrito-select mb-4 w-full">
              <option value="yellow">Yellow ($100K–$500K)</option>
              <option value="red">Red ($500K+)</option>
            </select>
            {(['buyer_name', 'buyer_email', 'buyer_phone'] as const).map(f => (
              <input key={f} placeholder={f.replace(/_/g, ' ')} value={form[f]} onChange={e => setForm(prev => ({ ...prev, [f]: e.target.value }))} className="rigburrito-input mb-3 w-full" />
            ))}
            <input type="number" placeholder="Commission Rate %" value={form.commission_rate} onChange={e => setForm(f => ({ ...f, commission_rate: e.target.value }))} className="rigburrito-input mb-3 w-full" />
            <textarea placeholder="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} className="rigburrito-textarea mb-4" />
            <AdminButton variant="accent" onClick={createDeal} className="w-full">Create Deal</AdminButton>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
