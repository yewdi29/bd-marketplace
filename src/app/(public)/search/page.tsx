'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ListingCardLink from '@/components/listings/ListingCardLink'
import ListingCardGrid from '@/components/listings/ListingCardGrid'
import ListingCardSkeleton from '@/components/listings/ListingCardSkeleton'
import FilterBar from '@/components/marketplace/FilterBar'
import type { Listing } from '@/lib/types/database'

// ─── Skeleton cards ───────────────────────────────────────────────────────────

function SkeletonCard() {
  return <ListingCardSkeleton />
}

function SkeletonGrid() {
  return (
    <ListingCardGrid className="listing-card-grid--search">
      {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
    </ListingCardGrid>
  )
}

function FilterBarFallback() {
  return (
    <div
      className="sticky z-40 bg-white border-b border-[#E8E9EA]"
      style={{ top: '58px', height: '53px' }}
    />
  )
}

// Browser geolocation, resolved once per "Closest to Me" selection.
// Resolves null on denial/failure so the API can fall back to the
// user's saved profile location.
function getBrowserCoords(): Promise<{ lat: number; lng: number } | null> {
  return new Promise(resolve => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve(null)
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 5000 }
    )
  })
}

function SearchContent() {
  const searchParams = useSearchParams()
  const [listings, setListings]     = useState<Listing[]>([])
  const [total, setTotal]           = useState(0)
  const [loading, setLoading]       = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [locationUnavailable, setLocationUnavailable] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setIsLoggedIn(!!data.user))
  }, [])

  const fetchListings = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      const q        = searchParams.get('q')
      const category = searchParams.get('category')
      const industry = searchParams.get('industry')
      const cat      = searchParams.get('cat')
      const country  = searchParams.get('country')
      const sort     = searchParams.get('sort')

      if (q)        params.set('q',        q)
      if (category) params.set('category', category)
      if (industry) params.set('industry', industry)
      if (cat)      params.set('cat',      cat)
      if (country)  params.set('country',  country)
      if (sort)     params.set('sort',     sort)
      params.set('limit', '48')

      // "Closest to Me" — try browser geolocation first; the API falls back
      // to the user's saved profile location, then to best match, on its own.
      if (sort === 'closest') {
        const coords = await getBrowserCoords()
        if (coords) {
          params.set('lat', String(coords.lat))
          params.set('lng', String(coords.lng))
        }
      }

      const res = await fetch(`/api/listings?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setListings(data.listings ?? [])
        setTotal(data.total ?? data.listings?.length ?? 0)
        setLocationUnavailable(!!data.locationUnavailable)
      }
    } finally {
      setLoading(false)
    }
  }, [searchParams])

  useEffect(() => {
    fetchListings()
  }, [fetchListings])

  return (
    <div className="page-shell py-8">
      <p className="font-sans font-bold text-sm text-ink mb-5">
        {loading
          ? <span className="inline-block h-4 w-32 bg-[#F0F0F0] rounded-full animate-pulse" />
          : `${total} ${total === 1 ? 'listing' : 'listings'} found`
        }
      </p>

      {!loading && locationUnavailable && (
        <div className="mb-5 px-4 py-2.5 rounded-[10px] bg-[#FFF2ED] border border-orange-bdr">
          <p className="text-sm font-sans text-orange">
            Location wasn&apos;t available — showing Best Match results instead.
          </p>
        </div>
      )}

      {loading ? (
        <SkeletonGrid />
      ) : listings.length > 0 ? (
        <ListingCardGrid className="listing-card-grid--search">
          {listings.map(listing => (
            <ListingCardLink
              key={listing.id}
              listing={listing}
              isLoggedIn={isLoggedIn}
              initialSaved={false}
              openInNewTab
            />
          ))}
        </ListingCardGrid>
      ) : (
        <div className="bg-white rounded-[16px] flex flex-col items-center justify-center py-24 text-center shadow-card">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="font-sans font-bold text-lg text-ink">No listings found</h3>
          <p className="mt-2 text-sm font-sans text-ink-3 max-w-xs">
            Try adjusting your filters or{' '}
            <a href="/search" className="text-orange hover:text-orange-lt font-semibold">
              view all listings
            </a>.
          </p>
        </div>
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <div className="-mt-6">
      <Suspense fallback={<FilterBarFallback />}>
        <FilterBar maxContentWidth={1450} />
      </Suspense>

      <Suspense fallback={
        <div className="page-shell py-8">
          <div className="h-4 w-32 bg-[#F0F0F0] rounded-full mb-5 animate-pulse" />
          <SkeletonGrid />
        </div>
      }>
        <SearchContent />
      </Suspense>
    </div>
  )
}
