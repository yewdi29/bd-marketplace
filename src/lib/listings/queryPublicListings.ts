import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import { buildTsQuery, stripMeasurements } from '@/lib/searchSynonyms'
import { haversineMiles } from '@/lib/distance'
import { applyActiveListingFilters } from '@/lib/search/listingFilters'
import { categorySlugLookupVariants, parseSlugList } from '@/lib/search/searchTaxonomy'
import {
  PUBLIC_LISTING_SELECT,
  PUBLIC_LISTING_SELECT_WITH_COORDS,
  toPublicListing,
  type PublicListing,
} from '@/lib/listings/publicListing'

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

function parseLimit(value: number | string | null | undefined): number {
  if (typeof value === 'number' && Number.isFinite(value)) return clamp(value, 1, 100)
  return clamp(Number.parseInt(String(value ?? '24'), 10) || 24, 1, 100)
}

function parseOffset(value: number | string | null | undefined): number {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, value)
  return Math.max(0, Number.parseInt(String(value ?? '0'), 10) || 0)
}

// Columns that can be used as sort keys — prevents injecting arbitrary column names
const ALLOWED_SORT_FIELDS = ['created_at', 'price'] as const

interface ListingRow {
  id: string
  latitude: number | null
  longitude: number | null
  states: { latitude: number | null; longitude: number | null } | null
  [key: string]: unknown
}

export type QueryPublicListingsParams = {
  category?: string | null
  industry?: string | null
  cat?: string | null
  country?: string | null
  tier?: string | null
  q?: string | null
  sort?: string | null
  lat?: string | null
  lng?: string | null
  limit?: number | string | null
  offset?: number | string | null
}

export type QueryPublicListingsResult = {
  listings: PublicListing[]
  total: number
  limit: number
  offset: number
  locationUnavailable?: boolean
}

export async function queryPublicListings(
  supabase: SupabaseClient,
  params: QueryPublicListingsParams,
): Promise<QueryPublicListingsResult> {
  const category = params.category
  const industry = params.industry
  const cat = params.cat
  const country = params.country
  const tier = params.tier
  const q = params.q
  const sort = params.sort ?? 'created_at:desc'
  const lat = params.lat
  const lng = params.lng
  const limit = parseLimit(params.limit)
  const offset = parseOffset(params.offset)

  // ── Resolve slug filters to ids ──────────────────────────────────────────────
  const industrySlugs = parseSlugList(industry)
  const catSlugs = parseSlugList(cat)
  const countrySlugs = parseSlugList(country)

  let industryIds: string[] = []
  let categoryIds: string[] = []
  let countryIds: string[] = []

  if (industrySlugs.length > 0) {
    const { data } = await supabase.from('industries').select('id').in('slug', industrySlugs)
    industryIds = (data ?? []).map(row => row.id)
  }
  if (catSlugs.length > 0) {
    const catLookup = catSlugs
      .flatMap(categorySlugLookupVariants)
      .filter((value, index, all) => all.indexOf(value) === index)
    const { data } = await supabase.from('categories').select('id').in('slug', catLookup)
    categoryIds = (data ?? []).map(row => row.id)
  }
  if (countrySlugs.length > 0) {
    const { data } = await supabase.from('countries').select('id').in('slug', countrySlugs)
    countryIds = (data ?? []).map(row => row.id)
  }

  const listingFilters = {
    industryIds,
    categoryIds,
    countryIds,
    legacyCategory: category,
    tier,
  }

  // ── Sort params (shared by both search paths) ───────────────────────────────
  const isClosest = sort === 'closest'
  const [rawField, rawDir] = sort.split(':')
  const sortField = (ALLOWED_SORT_FIELDS as readonly string[]).includes(rawField)
    ? rawField : 'created_at'
  const ascending = rawDir === 'asc'

  // The states(...) embed depends on the location-taxonomy migration having
  // been run — only request it when actually needed (closest-sort), so every
  // other sort/filter keeps working unchanged on a database that hasn't been
  // migrated yet.
  const SELECT_COLUMNS = isClosest
    ? PUBLIC_LISTING_SELECT_WITH_COORDS
    : PUBLIC_LISTING_SELECT

  // ── Helper: base query with all non-FTS filters applied ─────────────────────
  // Returns 'any' because each Supabase chain call narrows the TS return type,
  // making a truly generic helper impractical. We apply FTS on top externally.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function filteredBase(): any {
    return applyActiveListingFilters(
      supabase.from('listings').select(SELECT_COLUMNS),
      listingFilters,
    )
  }

  // ── Resolve the user's coordinates for "Closest to Me" ───────────────────────
  // 1. lat/lng query params — browser geolocation, obtained client-side.
  // 2. Fall back to the authenticated user's saved profile state.
  // 3. Neither available — sort falls back to best match, flagged for the UI.
  let userCoords: { lat: number; lng: number } | null = null
  let locationUnavailable = false

  if (isClosest) {
    if (lat && lng && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng))) {
      userCoords = { lat: Number(lat), lng: Number(lng) }
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('state')
          .eq('id', user.id)
          .maybeSingle()

        const profileState = profile?.state?.trim()
        if (profileState) {
          const { data: stateRow } = await supabase
            .from('states')
            .select('latitude, longitude')
            .or(`code.ilike.${profileState},name.ilike.${profileState}`)
            .maybeSingle()

          if (stateRow?.latitude != null && stateRow?.longitude != null) {
            userCoords = { lat: stateRow.latitude, lng: stateRow.longitude }
          }
        }
      }
    }

    if (!userCoords) locationUnavailable = true
  }

  // ── Helper: sort a listings array by distance from userCoords ───────────────
  function sortByDistance(rows: ListingRow[]): ListingRow[] {
    if (!userCoords) return rows
    const withCoords: ListingRow[] = []
    const withoutCoords: ListingRow[] = []

    for (const row of rows) {
      const rowLat = row.latitude ?? row.states?.latitude ?? null
      const rowLng = row.longitude ?? row.states?.longitude ?? null
      if (rowLat != null && rowLng != null) withCoords.push(row)
      else withoutCoords.push(row)
    }

    withCoords.sort((a, b) => {
      const aLat = a.latitude ?? a.states!.latitude!
      const aLng = a.longitude ?? a.states!.longitude!
      const bLat = b.latitude ?? b.states!.latitude!
      const bLng = b.longitude ?? b.states!.longitude!
      return (
        haversineMiles(userCoords!.lat, userCoords!.lng, aLat, aLng) -
        haversineMiles(userCoords!.lat, userCoords!.lng, bLat, bLng)
      )
    })

    return [...withCoords, ...withoutCoords]
  }

  // ── Two-stage search when q is present ──────────────────────────────────────
  if (q) {
    // Prepare the Stage 2 tsquery: strip measurements, expand synonyms
    const strippedQ = stripMeasurements(q)
    const tsQuery = strippedQ ? buildTsQuery(strippedQ) : ''

    // Run both stages in parallel for performance
    const [s1Result, s2Result] = await Promise.all([
      // Stage 1 — plainto_tsquery with the full original query.
      // Preserves size/measurement terms so "5 inch drill pipe" matches precisely.
      filteredBase()
        .textSearch('search_vector', q, { type: 'plain', config: 'english' })
        .order(sortField, { ascending })
        .limit(limit),

      // Stage 2 — to_tsquery with measurements stripped and synonyms expanded.
      // "pipe rack" → "pipe & rack | pipe & stacker | tubular & rack | …"
      // Surfaces related category inventory that Stage 1 might miss.
      tsQuery
        ? filteredBase()
            .filter('search_vector', 'fts', tsQuery)
            .order(sortField, { ascending })
            .limit(limit)
        : Promise.resolve({ data: [] as unknown[], error: null }),
    ])

    if (s1Result.error) throw s1Result.error
    if (s2Result.error) throw s2Result.error

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stage1: any[] = s1Result.data ?? []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stage2: any[] = s2Result.error ? [] : (s2Result.data ?? [])

    // Merge: Stage 1 (exact/size matches) first, then Stage 2 deduped by id.
    // If Stage 1 is empty, Stage 2 results fill the response on their own.
    const stage1Ids = new Set(stage1.map((r: { id: string }) => r.id))
    let merged = [
      ...stage1,
      ...stage2.filter((r: { id: string }) => !stage1Ids.has(r.id)),
    ].slice(0, limit)

    if (isClosest) merged = sortByDistance(merged)

    return {
      listings: merged.map(toPublicListing),
      total: merged.length,
      limit,
      offset,
      ...(isClosest ? { locationUnavailable } : {}),
    }
  }

  // ── No search query — single query with exact count + cursor pagination ──────
  let query = applyActiveListingFilters(
    supabase.from('listings').select(SELECT_COLUMNS, { count: 'exact' }),
    listingFilters,
  )

  // "Closest to Me" needs the full matching set in memory to sort by distance —
  // pagination is applied after sorting instead of via .range().
  if (isClosest) {
    const { data, error, count } = await query.order(sortField, { ascending })
    if (error) throw error

    const sorted = sortByDistance((data ?? []) as unknown as ListingRow[])
    const page = sorted.slice(offset, offset + limit)

    return {
      listings: page.map(toPublicListing),
      total: count ?? 0,
      limit,
      offset,
      locationUnavailable,
    }
  }

  query = query.order(sortField, { ascending }).range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) throw error

  return {
    listings: (data ?? []).map(toPublicListing),
    total: count ?? 0,
    limit,
    offset,
  }
}
