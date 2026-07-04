'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import * as Tabs from '@radix-ui/react-tabs'
import { Inbox } from 'lucide-react'
import AdminButton from '@/components/rigburrito/AdminButton'
import EmptyState from '@/components/rigburrito/EmptyState'
import ErrorState from '@/components/rigburrito/ErrorState'
import HoldToConfirmButton from '@/components/rigburrito/HoldToConfirmButton'
import Pagination from '@/components/rigburrito/Pagination'
import SlideOver from '@/components/rigburrito/SlideOver'
import StatusBadge from '@/components/rigburrito/StatusBadge'
import TableSkeleton from '@/components/rigburrito/TableSkeleton'
import { formatCurrency, formatDate } from '@/lib/rigburrito/utils'
import type { AdminListingRow } from '@/lib/rigburrito/types'

type ListingTab = 'pending' | 'live'

export default function ListingsPage() {
  const [listings, setListings] = useState<AdminListingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<ListingTab>('pending')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selected, setSelected] = useState<AdminListingRow | null>(null)
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null)

  const fetchListings = useCallback(async () => {
    setLoading(true)
    setError('')
    const params = new URLSearchParams({ page: String(page), tab })
    if (search) params.set('search', search)
    try {
      const res = await fetch(`/api/rigburrito/listings?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setListings(data.listings)
      setTotalPages(data.total_pages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load listings')
    } finally {
      setLoading(false)
    }
  }, [page, search, tab])

  useEffect(() => { fetchListings() }, [fetchListings])

  async function openListing(listing: AdminListingRow) {
    setSelected(listing)
    const res = await fetch(`/api/rigburrito/listings/${listing.id}`)
    const data = await res.json()
    setDetail(data.listing)
  }

  async function patchListing(updates: Record<string, unknown>) {
    if (!selected) return
    await fetch(`/api/rigburrito/listings/${selected.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    setSelected(null)
    fetchListings()
  }

  async function removeListing() {
    if (!selected) return
    await fetch(`/api/rigburrito/listings/${selected.id}`, { method: 'DELETE' })
    setSelected(null)
    fetchListings()
  }

  const images = (detail?.listing_images as { url: string }[] | undefined) ?? []

  const slideFooter = selected && detail ? (
    <>
      {tab === 'pending' && (
        <AdminButton variant="primary" onClick={() => patchListing({ status: 'active' })} style={{ background: '#16A34A' }}>Approve</AdminButton>
      )}
      {tab === 'live' && (
        <AdminButton variant="secondary" onClick={() => patchListing({ status: 'draft' })}>Unpublish</AdminButton>
      )}
      <AdminButton variant="secondary" onClick={() => patchListing({ admin_flagged: true })}>Flag</AdminButton>
      {selected.slug && (
        <a href={`/listings/${selected.slug}`} target="_blank" rel="noopener noreferrer" className="rigburrito-btn rigburrito-btn-secondary no-underline">View Public</a>
      )}
      <HoldToConfirmButton label="Remove" onConfirm={removeListing} />
    </>
  ) : null

  return (
    <div>
      <h1 className="rigburrito-page-title">Listing Moderation</h1>

      <Tabs.Root value={tab} onValueChange={v => { setTab(v as ListingTab); setPage(1) }}>
        <Tabs.List className="mb-4 flex gap-2">
          <Tabs.Trigger value="pending" className="rigburrito-tab">Pending Approval</Tabs.Trigger>
          <Tabs.Trigger value="live" className="rigburrito-tab">Live Listings</Tabs.Trigger>
        </Tabs.List>
      </Tabs.Root>

      <div className="mb-4">
        <input
          type="search"
          placeholder="Search title or seller..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="rigburrito-input"
          style={{ minWidth: 240 }}
        />
      </div>

      {loading ? <TableSkeleton /> : error ? <ErrorState message={error} onRetry={fetchListings} /> : (
        <div className="rigburrito-table-wrap">
          {listings.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title={tab === 'pending' ? 'No pending listings' : 'No live listings'}
              description={tab === 'pending' ? 'All submissions have been reviewed.' : 'No active listings on the platform.'}
            />
          ) : (
            <table className="rigburrito-table">
              <thead>
                <tr>
                  {['', 'Title', 'Seller', 'Category', 'Price', 'Location', 'Status', 'Created'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {listings.map(l => (
                  <tr key={l.id} className="rigburrito-table-row--clickable" onClick={() => openListing(l)}>
                    <td>
                      {l.primary_image_url ? (
                        <Image src={l.primary_image_url} alt="" width={48} height={36} className="rounded object-cover" style={{ width: 48, height: 36 }} />
                      ) : <div className="h-9 w-12 rounded bg-[#F0F1F3]" />}
                    </td>
                    <td className="max-w-[200px] truncate font-medium">{l.title}</td>
                    <td>{l.seller_name}</td>
                    <td className="rigburrito-caption" style={{ color: '#6B7280' }}>{l.industry_name ?? l.category}</td>
                    <td className="rigburrito-mono">{formatCurrency(l.price)}</td>
                    <td className="rigburrito-caption" style={{ color: '#6B7280' }}>{[l.location_city, l.location_state].filter(Boolean).join(', ') || '—'}</td>
                    <td><StatusBadge status={l.status} />{l.admin_flagged && <span className="ml-1 text-xs text-red-500">Flagged</span>}</td>
                    <td className="rigburrito-caption" style={{ color: '#6B7280' }}>{formatDate(l.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="px-4 pb-4"><Pagination page={page} totalPages={totalPages} onPageChange={setPage} /></div>
        </div>
      )}

      <SlideOver
        open={!!selected}
        onOpenChange={o => !o && setSelected(null)}
        title="Listing Details"
        footer={slideFooter}
      >
        {selected && detail && (
          <div className="space-y-4">
            {images.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img, i) => (
                  <Image key={i} src={img.url} alt="" width={120} height={90} className="shrink-0 rounded object-cover" style={{ width: 120, height: 90 }} />
                ))}
              </div>
            )}
            <div>
              <p className="rigburrito-card-label">Title</p>
              <p className="rigburrito-body mt-1 font-medium">{String(detail.title)}</p>
            </div>
            <div>
              <p className="rigburrito-card-label">Price</p>
              <p className="rigburrito-mono rigburrito-body mt-1">{formatCurrency(Number(detail.price))}</p>
            </div>
            <div>
              <p className="rigburrito-card-label">Description</p>
              <p className="rigburrito-body mt-1">{String(detail.description ?? '—')}</p>
            </div>
          </div>
        )}
      </SlideOver>
    </div>
  )
}
