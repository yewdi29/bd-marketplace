'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ListingCard from '@/components/ListingCard'
import FilterBar from '@/components/marketplace/FilterBar'
import type { Listing } from '@/lib/types/database'

// ─── Skeleton cards ───────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-[16px] overflow-hidden border border-[#E8E9EA] animate-pulse">
      <div className="bg-[#F0F0F0]" style={{ paddingBottom: '60%' }} />
      <div className="p-4 space-y-2.5">
        <div className="h-3 bg-[#F0F0F0] rounded-full w-24" />
        <div className="h-4 bg-[#F0F0F0] rounded-full w-full" />
        <div className="h-4 bg-[#F0F0F0] rounded-full w-3/4" />
        <div className="h-4 bg-[#F0F0F0] rounded-full w-20" />
      </div>
    </div>
  )
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  )
}

// ─── FilterBar skeleton (shown while FilterBar suspends) ──────────────────────

function FilterBarFallback() {
  return (
    <div
      className="sticky z-40 bg-white border-b border-[#E8E9EA]"
      style={{ top: '58px', height: '53px' }}
    />
  )
}

// ─── Main listings content (reads from URL, fetches from API) ─────────────────

function ListingsContent() {
  const searchParams = useSearchParams()
  const [listings, setListings]   = useState<Listing[]>([])
  const [total, setTotal]         = useState(0)
  const [loading, setLoading]     = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // Check auth once on mount so the heart button works correctly
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setIsLoggedIn(!!data.user))
  }, [])

  const fetchListings = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      const q          = searchParams.get('q')
      const category   = searchParams.get('category')
      const conditions = searchParams.get('conditions')
      const priceRange = searchParams.get('priceRange')
      const state      = searchParams.get('state')
      const sort       = searchParams.get('sort')

      if (q)          params.set('q',          q)
      if (category)   params.set('category',   category)
      if (conditions) params.set('conditions', conditions)
      if (priceRange) params.set('priceRange', priceRange)
      if (state)      params.set('state',      state)
      if (sort)       params.set('sort',       sort)
      params.set('limit', '48')

      const res = await fetch(`/api/listings?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setListings(data.listings ?? [])
        setTotal(data.total ?? data.listings?.length ?? 0)
      }
    } finally {
      setLoading(false)
    }
  }, [searchParams])

  useEffect(() => {
    fetchListings()
  }, [fetchListings])

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-8">

      {/* Results count */}
      <p className="font-sans font-bold text-sm text-ink mb-5">
        {loading
          ? <span className="inline-block h-4 w-32 bg-[#F0F0F0] rounded-full animate-pulse" />
          : `${total} ${total === 1 ? 'listing' : 'listings'} found`
        }
      </p>

      {/* Grid */}
      {loading ? (
        <SkeletonGrid />
      ) : listings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {listings.map(listing => (
            <ListingCard
              key={listing.id}
              listing={listing}
              isLoggedIn={isLoggedIn}
              initialSaved={false}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[16px] flex flex-col items-center justify-center py-24 text-center shadow-card">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="font-sans font-bold text-lg text-ink">No listings found</h3>
          <p className="mt-2 text-sm font-sans text-ink-3 max-w-xs">
            Try adjusting your filters or{' '}
            <a href="/listings" className="text-orange hover:text-orange-lt font-semibold">
              view all listings
            </a>.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ListingsPage() {
  // The public layout adds pt-[82px] to <main> to clear the 58px fixed navbar.
  // The remaining 24px gap would sit between the navbar and the filter bar.
  // Pull the whole page up by -24px so the filter bar butts flush against the nav.
  return (
    <div className="-mt-6">
      {/* FilterBar in its own Suspense so it can use useSearchParams */}
      <Suspense fallback={<FilterBarFallback />}>
        <FilterBar />
      </Suspense>

      {/* Listings grid — separate Suspense to show skeleton independently */}
      <Suspense fallback={
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-8">
          <div className="h-4 w-32 bg-[#F0F0F0] rounded-full mb-5 animate-pulse" />
          <SkeletonGrid />
        </div>
      }>
        <ListingsContent />
      </Suspense>
    </div>
  )
}
