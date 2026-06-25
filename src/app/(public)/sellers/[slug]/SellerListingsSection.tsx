'use client'

import { useState, useMemo } from 'react'
import type { Listing } from '@/lib/types/database'
import ListingCard from '@/components/ListingCard'
import ListingCardGrid from '@/components/listings/ListingCardGrid'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  activeListings: Listing[]
  soldListings: Listing[]
}

type Tab = 'active' | 'sold'
type SortKey = 'newest' | 'price_asc' | 'price_desc'

const PAGE_SIZE = 9

// ─── Pagination ─────────────────────────────────────────────────────────────

interface PaginationProps {
  page: number
  totalPages: number
  onPage: (p: number) => void
}

function Pagination({ page, totalPages, onPage }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages: (number | '…')[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (page > 3) pages.push('…')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i)
    }
    if (page < totalPages - 2) pages.push('…')
    pages.push(totalPages)
  }

  return (
    <div className="flex items-center justify-center gap-1.5 mt-8">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page === 1}
        className="w-8 h-8 flex items-center justify-center rounded-full border border-[#E8E9EA] text-ink-3 hover:text-ink hover:border-[#D4D5D7] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {pages.map((p, idx) =>
        p === '…' ? (
          <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center font-mono text-[12px] text-ink-3">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPage(p as number)}
            className="w-8 h-8 flex items-center justify-center rounded-full font-mono text-[12px] font-bold transition-colors"
            style={
              p === page
                ? { background: '#FF6B35', color: '#FFFFFF' }
                : { color: '#4A4D52' }
            }
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPage(page + 1)}
        disabled={page === totalPages}
        className="w-8 h-8 flex items-center justify-center rounded-full border border-[#E8E9EA] text-ink-3 hover:text-ink hover:border-[#D4D5D7] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}

const soldOverlay = (
  <div className="absolute inset-0 flex items-center justify-center">
    <span
      className="px-3 py-1 text-[11px] font-mono font-bold rounded-pill border"
      style={{ background: '#FFF0F0', color: '#CC0000', borderColor: '#FFCCCC' }}
    >
      SOLD
    </span>
  </div>
)

// ─── Main Component ────────────────────────────────────────────────────────────

export default function SellerListingsSection({ activeListings, soldListings }: Props) {
  const [tab, setTab] = useState<Tab>('active')
  const [sort, setSort] = useState<SortKey>('newest')
  const [page, setPage] = useState(1)

  const activeCount = activeListings.length
  const soldCount = soldListings.length

  const sortedListings = useMemo(() => {
    const source = tab === 'active' ? [...activeListings] : [...soldListings]
    switch (sort) {
      case 'newest':
        return source.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      case 'price_asc':
        return source.sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
      case 'price_desc':
        return source.sort((a, b) => (b.price ?? 0) - (a.price ?? 0))
      default:
        return source
    }
  }, [tab, sort, activeListings, soldListings])

  const totalPages = Math.ceil(sortedListings.length / PAGE_SIZE)
  const paginated = sortedListings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function switchTab(t: Tab) {
    setTab(t)
    setPage(1)
  }

  function switchSort(s: SortKey) {
    setSort(s)
    setPage(1)
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => switchTab('active')}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-pill border text-sm font-bold transition-colors"
            style={
              tab === 'active'
                ? { background: '#1A1D20', color: '#FFFFFF', borderColor: '#1A1D20' }
                : { background: '#FFFFFF', color: '#4A4D52', borderColor: '#E8E9EA' }
            }
          >
            Active
            <span
              className="px-1.5 py-0.5 rounded-pill font-mono text-[11px] font-bold"
              style={
                tab === 'active'
                  ? { background: 'rgba(255,255,255,0.18)', color: '#FFFFFF' }
                  : { background: '#F0F0F0', color: '#9A9DA2' }
              }
            >
              {activeCount}
            </span>
          </button>

          {soldCount > 0 && (
            <button
              onClick={() => switchTab('sold')}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-pill border text-sm font-bold transition-colors"
              style={
                tab === 'sold'
                  ? { background: '#1A1D20', color: '#FFFFFF', borderColor: '#1A1D20' }
                  : { background: '#FFFFFF', color: '#4A4D52', borderColor: '#E8E9EA' }
              }
            >
              Sold
              <span
                className="px-1.5 py-0.5 rounded-pill font-mono text-[11px] font-bold"
                style={
                  tab === 'sold'
                    ? { background: 'rgba(255,255,255,0.18)', color: '#FFFFFF' }
                    : { background: '#F0F0F0', color: '#9A9DA2' }
                }
              >
                {soldCount}
              </span>
            </button>
          )}
        </div>

        <select
          value={sort}
          onChange={e => switchSort(e.target.value as SortKey)}
          className="text-sm font-sans text-ink bg-white border border-[#E8E9EA] rounded-[10px] px-3 py-1.5 outline-none focus:border-orange transition-colors cursor-pointer"
        >
          <option value="newest">Newest First</option>
          <option value="price_asc">Price: Low → High</option>
          <option value="price_desc">Price: High → Low</option>
        </select>
      </div>

      {paginated.length === 0 ? (
        <div
          className="bg-white border border-[#E8E9EA] rounded-[16px] py-16 text-center"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
        >
          <p className="font-sans text-ink-3 text-sm">No listings to show.</p>
        </div>
      ) : (
        <ListingCardGrid>
          {paginated.map(listing =>
            tab === 'active' ? (
              <ListingCard key={listing.id} listing={listing} showSave={false} />
            ) : (
              <ListingCard
                key={listing.id}
                listing={listing}
                mode="static"
                showSave={false}
                priceMuted
                imageClassName="opacity-60 grayscale"
                thumbnailOverlay={soldOverlay}
              />
            )
          )}
        </ListingCardGrid>
      )}

      <Pagination page={page} totalPages={totalPages} onPage={p => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }} />
    </div>
  )
}
