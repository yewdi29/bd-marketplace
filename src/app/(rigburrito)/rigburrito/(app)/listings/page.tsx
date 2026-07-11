'use client'

import { useCallback, useEffect, useState } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import AdminListingsModerationTable from '@/components/rigburrito/AdminListingsModerationTable'
import Pagination from '@/components/rigburrito/Pagination'
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

  return (
    <div>
      <h1 className="rigburrito-page-title">Listing Moderation</h1>

      <Tabs.Root value={tab} onValueChange={v => { setTab(v as ListingTab); setPage(1) }}>
        <Tabs.List className="mb-4 flex gap-2">
          <Tabs.Trigger value="pending" className="rigburrito-tab">Pending Review</Tabs.Trigger>
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

      <AdminListingsModerationTable
        listings={listings}
        mode={tab}
        loading={loading}
        error={error}
        onRetry={fetchListings}
        onRefresh={fetchListings}
        footer={(
          <div className="px-4 pb-4">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      />
    </div>
  )
}
