'use client'

import { useState } from 'react'
import Image from 'next/image'
import * as Dialog from '@radix-ui/react-dialog'
import { CheckCircle, EyeOff, ExternalLink, Flag, Inbox, Trash2, X } from 'lucide-react'
import AdminButton from '@/components/rigburrito/AdminButton'
import EmptyState from '@/components/rigburrito/EmptyState'
import ErrorState from '@/components/rigburrito/ErrorState'
import ListingImageStrip from '@/components/rigburrito/ListingImageStrip'
import SlideOver from '@/components/rigburrito/SlideOver'
import StatusBadge from '@/components/rigburrito/StatusBadge'
import TableSkeleton from '@/components/rigburrito/TableSkeleton'
import { formatAdminTablePrice, formatPriceAmount } from '@/lib/formatPrice'
import { formatDate } from '@/lib/rigburrito/utils'
import type { AdminListingRow } from '@/lib/rigburrito/types'

type ModerationMode = 'pending' | 'live'

interface AdminListingsModerationTableProps {
  listings: AdminListingRow[]
  mode: ModerationMode
  loading?: boolean
  error?: string
  onRetry?: () => void
  onRefresh: () => void
  emptyTitle?: string
  emptyDescription?: string
  footer?: React.ReactNode
}

export default function AdminListingsModerationTable({
  listings,
  mode,
  loading = false,
  error = '',
  onRetry,
  onRefresh,
  emptyTitle,
  emptyDescription,
  footer,
}: AdminListingsModerationTableProps) {
  const [selected, setSelected] = useState<AdminListingRow | null>(null)
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null)
  const [flagOpen, setFlagOpen] = useState(false)
  const [flagComment, setFlagComment] = useState('')
  const [flagError, setFlagError] = useState('')
  const [flagging, setFlagging] = useState(false)
  const [removeOpen, setRemoveOpen] = useState(false)
  const [removeReason, setRemoveReason] = useState('')
  const [removeError, setRemoveError] = useState('')
  const [removing, setRemoving] = useState(false)

  async function openListing(listing: AdminListingRow) {
    setSelected(listing)
    const res = await fetch(`/api/rigburrito/listings/${listing.id}`)
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? 'Failed to load listing')
    setDetail(data.listing)
  }

  function closeListing() {
    setSelected(null)
    setDetail(null)
  }

  async function patchListing(updates: Record<string, unknown>) {
    if (!selected) return
    const res = await fetch(`/api/rigburrito/listings/${selected.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error ?? 'Action failed')
    }
    closeListing()
    onRefresh()
  }

  async function flagListing() {
    if (!selected) return
    if (flagComment.trim().length < 20) {
      setFlagError('Comment must be at least 20 characters')
      return
    }
    setFlagging(true)
    setFlagError('')
    try {
      const res = await fetch(`/api/rigburrito/listings/${selected.id}/flag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: flagComment.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to flag listing')
      setFlagOpen(false)
      setFlagComment('')
      closeListing()
      onRefresh()
    } catch (err) {
      setFlagError(err instanceof Error ? err.message : 'Failed to flag listing')
    } finally {
      setFlagging(false)
    }
  }

  async function removeListing() {
    if (!selected) return
    if (removeReason.trim().length < 20) {
      setRemoveError('Removal reason must be at least 20 characters')
      return
    }
    setRemoving(true)
    setRemoveError('')
    try {
      const res = await fetch(`/api/rigburrito/listings/${selected.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ removal_reason: removeReason.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to remove listing')
      setRemoveOpen(false)
      setRemoveReason('')
      closeListing()
      onRefresh()
    } catch (err) {
      setRemoveError(err instanceof Error ? err.message : 'Failed to remove listing')
    } finally {
      setRemoving(false)
    }
  }

  const images = (detail?.listing_images as { url: string }[] | undefined) ?? []

  const slideFooter = selected ? (
    <div className="rigburrito-slideover-actions">
      {mode === 'pending' && (
        <AdminButton variant="success" onClick={() => patchListing({ status: 'active' })}>
          <CheckCircle size={14} strokeWidth={2} />
          Approve
        </AdminButton>
      )}
      {mode === 'live' && (
        <AdminButton variant="muted" onClick={() => patchListing({ status: 'draft' })}>
          <EyeOff size={14} strokeWidth={2} />
          Unpublish
        </AdminButton>
      )}
      <AdminButton variant="warning" onClick={() => { setFlagComment(''); setFlagError(''); setFlagOpen(true) }}>
        <Flag size={14} strokeWidth={2} />
        Flag
      </AdminButton>
      {selected.slug && (
        <a
          href={`/listings/${selected.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rigburrito-btn rigburrito-btn-muted no-underline"
        >
          <ExternalLink size={14} strokeWidth={2} />
          View Public
        </a>
      )}
      <AdminButton variant="danger" onClick={() => { setRemoveReason(''); setRemoveError(''); setRemoveOpen(true) }}>
        <Trash2 size={14} strokeWidth={2} />
        Remove
      </AdminButton>
    </div>
  ) : null

  if (loading) return <TableSkeleton />

  if (error) {
    return <ErrorState message={error} onRetry={onRetry ?? onRefresh} />
  }

  return (
    <>
      <div className="rigburrito-table-wrap rigburrito-table-wrap--scroll-y">
        {listings.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title={emptyTitle ?? (mode === 'pending' ? 'No pending listings' : 'No live listings')}
            description={
              emptyDescription
              ?? (mode === 'pending'
                ? 'All submissions have been reviewed.'
                : 'No active listings on the platform.')
            }
          />
        ) : (
          <div className="rigburrito-table-scroll-inner">
            <table className="rigburrito-table rigburrito-table--data">
              <thead>
                <tr>
                  {['', 'Title', 'Seller', 'Category', 'Price', 'Location', 'Status', 'Created'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {listings.map(l => (
                  <tr
                    key={l.id}
                    className="rigburrito-table-row--clickable"
                    onClick={() => { void openListing(l) }}
                  >
                  <td>
                    {l.primary_image_url ? (
                      <Image
                        src={l.primary_image_url}
                        alt=""
                        width={48}
                        height={36}
                        className="rounded object-cover"
                        style={{ width: 48, height: 36 }}
                      />
                    ) : (
                      <div className="h-9 w-12 rounded bg-[#F0F1F3]" />
                    )}
                  </td>
                  <td className="font-medium">{l.title}</td>
                  <td>{l.seller_name}</td>
                  <td style={{ color: '#6B7280' }}>{l.industry_name ?? l.category}</td>
                  <td className="rigburrito-mono">
                    {formatAdminTablePrice(l.price, l.price_unit, l.price_visible)}
                  </td>
                  <td style={{ color: '#6B7280' }}>
                    {[l.location_city, l.location_state].filter(Boolean).join(', ') || '—'}
                  </td>
                  <td>
                    <StatusBadge status={l.status} />
                    {l.admin_flagged && <span className="ml-1 text-xs text-red-500">Flagged</span>}
                  </td>
                  <td style={{ color: '#6B7280' }}>{formatDate(l.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
        {footer}
      </div>

      <SlideOver
        open={!!selected}
        onOpenChange={o => !o && closeListing()}
        title="Listing Details"
        footer={slideFooter}
        width="580px"
      >
        {selected && detail && (
          <div className="space-y-4">
            {images.length > 0 && <ListingImageStrip images={images} />}
            <div>
              <p className="rigburrito-card-label">Title</p>
              <p className="rigburrito-body mt-1 font-medium">{String(detail.title)}</p>
            </div>
            <div>
              <p className="rigburrito-card-label">Price</p>
              <p className="rigburrito-mono rigburrito-body mt-1">
                {formatPriceAmount(
                  Number(detail.price),
                  String(detail.price_unit ?? 'total'),
                )}
              </p>
              {selected.price_visible ? (
                <span
                  className="mt-2 inline-block"
                  style={{
                    borderRadius: 999,
                    padding: '2px 8px',
                    fontSize: 11,
                    fontWeight: 500,
                    color: '#16A34A',
                    background: '#F0FDF4',
                    border: '1px solid #BBF7D0',
                  }}
                >
                  Price visible to buyers
                </span>
              ) : (
                <span
                  className="mt-2 inline-block"
                  style={{
                    borderRadius: 999,
                    padding: '2px 8px',
                    fontSize: 11,
                    fontWeight: 500,
                    color: '#D97706',
                    background: '#FFFBEB',
                    border: '1px solid #FDE68A',
                  }}
                >
                  Contact for pricing active
                </span>
              )}
            </div>
            <div>
              <p className="rigburrito-card-label">Description</p>
              <p className="rigburrito-body mt-1">{String(detail.description ?? '—')}</p>
            </div>
          </div>
        )}
      </SlideOver>

      <Dialog.Root open={flagOpen} onOpenChange={setFlagOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50" style={{ background: 'rgba(0,0,0,0.4)' }} />
          <Dialog.Content
            className="rigburrito-card fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 p-6 outline-none"
            style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
          >
            <div className="mb-4 flex items-center justify-between">
              <Dialog.Title className="rigburrito-section-title" style={{ marginBottom: 0 }}>
                Flag &amp; Unpublish
              </Dialog.Title>
              <Dialog.Close asChild>
                <button type="button" className="rigburrito-btn-icon"><X size={16} /></button>
              </Dialog.Close>
            </div>
            <label className="rigburrito-card-label mb-2 block">
              Flag Comment — describe what needs to be changed
            </label>
            <textarea
              value={flagComment}
              onChange={e => { setFlagComment(e.target.value); setFlagError('') }}
              rows={4}
              className="rigburrito-textarea mb-2 w-full"
              placeholder="Describe the issues with this listing (minimum 20 characters)..."
            />
            {flagError && <p className="mb-3 text-sm text-red-600">{flagError}</p>}
            <div className="flex gap-2 justify-end">
              <AdminButton variant="muted" onClick={() => setFlagOpen(false)}>Cancel</AdminButton>
              <AdminButton
                variant="warning"
                disabled={flagging || flagComment.trim().length < 20}
                onClick={flagListing}
              >
                Flag &amp; Unpublish
              </AdminButton>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={removeOpen} onOpenChange={setRemoveOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50" style={{ background: 'rgba(0,0,0,0.4)' }} />
          <Dialog.Content
            className="rigburrito-card fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 p-6 outline-none"
            style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
          >
            <div className="mb-4 flex items-center justify-between">
              <Dialog.Title className="rigburrito-section-title" style={{ marginBottom: 0 }}>
                Remove Listing
              </Dialog.Title>
              <Dialog.Close asChild>
                <button type="button" className="rigburrito-btn-icon"><X size={16} /></button>
              </Dialog.Close>
            </div>
            <p className="rigburrito-body mb-3" style={{ color: '#6B7280' }}>
              This will remove the listing from the marketplace and notify the seller with your reason.
            </p>
            <label className="rigburrito-card-label mb-2 block">
              Removal reason — required
            </label>
            <textarea
              value={removeReason}
              onChange={e => { setRemoveReason(e.target.value); setRemoveError('') }}
              rows={4}
              className="rigburrito-textarea mb-2 w-full"
              placeholder="Explain why this listing is being removed (minimum 20 characters)..."
            />
            {removeError && <p className="mb-3 text-sm text-red-600">{removeError}</p>}
            <div className="flex gap-2 justify-end">
              <AdminButton variant="muted" onClick={() => setRemoveOpen(false)}>Cancel</AdminButton>
              <AdminButton
                variant="danger"
                disabled={removing || removeReason.trim().length < 20}
                onClick={removeListing}
              >
                Remove listing
              </AdminButton>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}
