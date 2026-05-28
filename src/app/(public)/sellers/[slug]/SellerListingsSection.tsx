'use client'

import { useState, useMemo } from 'react'
import type { Listing } from '@/lib/types/database'
import { formatPrice } from '@/lib/formatPrice'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  activeListings: Listing[]
  soldListings: Listing[]
}

type Tab = 'active' | 'sold'
type SortKey = 'newest' | 'price_asc' | 'price_desc'

const PAGE_SIZE = 9

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPrimaryImage(listing: Listing) {
  const imgs = listing.listing_images ?? []
  return imgs.find(i => i.is_primary) ?? imgs.sort((a, b) => a.sort_order - b.sort_order)[0] ?? null
}

function catLabel(val: string) {
  return val.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// ─── Sold Card ────────────────────────────────────────────────────────────────

function SoldCard({ listing }: { listing: Listing }) {
  const img = getPrimaryImage(listing)
  return (
    <div
      className="bg-white border border-[#E8E9EA] rounded-[16px] overflow-hidden"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
    >
      <div className="relative aspect-[4/3] bg-[#F0F0F0] overflow-hidden">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img.url}
            alt={listing.title}
            className="w-full h-full object-cover opacity-60 grayscale"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-10 h-10 text-ink-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="px-3 py-1 text-[11px] font-mono font-bold rounded-pill border"
            style={{ background: '#FFF0F0', color: '#CC0000', borderColor: '#FFCCCC' }}
          >
            SOLD
          </span>
        </div>
      </div>
      <div className="p-3">
        <p className="font-mono text-[12px] uppercase tracking-[0.08em] text-ink-3 mb-1">{catLabel(listing.category)}</p>
        <p className="text-sm font-semibold text-ink-2 leading-snug line-clamp-2 mb-1.5">{listing.title}</p>
        <p className="font-mono text-sm font-medium text-ink-3">
          {formatPrice(listing.price, listing.price_unit ?? 'total', listing.price_visible)}
        </p>
      </div>
    </div>
  )
}

// ─── Active Card ──────────────────────────────────────────────────────────────

function ActiveCard({ listing }: { listing: Listing }) {
  const img = getPrimaryImage(listing)
  return (
    <Link
      href={`/listings/${listing.slug}`}
      className="group block bg-white border border-[#E8E9EA] rounded-[16px] overflow-hidden transition-all hover:-translate-y-0.5"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
    >
      <div className="relative aspect-[4/3] bg-[#F0F0F0] overflow-hidden">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img.url}
            alt={listing.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-10 h-10 text-ink-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="font-mono text-[12px] uppercase tracking-[0.08em] text-ink-3 mb-1">{catLabel(listing.category)}</p>
        <p className="text-sm font-semibold text-ink leading-snug line-clamp-2 mb-1.5">{listing.title}</p>
        <p className="font-mono text-sm font-medium" style={{ color: '#FF6B35' }}>
          {formatPrice(listing.price, listing.price_unit ?? 'total', listing.price_visible)}
        </p>
      </div>
    </Link>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────

interface PaginationProps {
  page: number
  totalPages: number
  onPage: (p: number) => void
}

function Pagination({ page, totalPages, onPage }: PaginationProps) {
  if (totalPages <= 1) return null

  // Build page number list with ellipsis logic
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
      {/* Prev */}
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

      {/* Next */}
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
      {/* Controls row: tab pills + sort dropdown */}
      <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">

        {/* Tab pills */}
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

        {/* Sort dropdown */}
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

      {/* Grid */}
      {paginated.length === 0 ? (
        <div
          className="bg-white border border-[#E8E9EA] rounded-[16px] py-16 text-center"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
        >
          <p className="font-sans text-ink-3 text-sm">No listings to show.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginated.map(listing =>
            tab === 'active'
              ? <ActiveCard key={listing.id} listing={listing} />
              : <SoldCard key={listing.id} listing={listing} />
          )}
        </div>
      )}

      {/* Pagination */}
      <Pagination page={page} totalPages={totalPages} onPage={p => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }} />
    </div>
  )
}
