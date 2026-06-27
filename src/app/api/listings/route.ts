import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { buildTsQuery, stripMeasurements } from '@/lib/searchSynonyms'
import { haversineMiles } from '@/lib/distance'
import { resolveCategoryAndIndustryIds } from '@/lib/categoryResolver'

// Columns that can be used as sort keys — prevents injecting arbitrary column names
const ALLOWED_SORT_FIELDS = ['created_at', 'price'] as const

interface ListingRow {
  id: string
  latitude: number | null
  longitude: number | null
  states: { latitude: number | null; longitude: number | null } | null
  [key: string]: unknown
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const category = searchParams.get('category')
  const industry  = searchParams.get('industry')  // comma-separated industry slugs
  const cat        = searchParams.get('cat')        // comma-separated category slugs
  const country     = searchParams.get('country')    // comma-separated country slugs
  const tier     = searchParams.get('tier')
  const q        = searchParams.get('q')
  const sort     = searchParams.get('sort') ?? 'created_at:desc'
  const lat       = searchParams.get('lat')          // optional — browser geolocation
  const lng       = searchParams.get('lng')
  const limit    = Math.min(parseInt(searchParams.get('limit') ?? '24'), 100)
  const offset   = parseInt(searchParams.get('offset') ?? '0')

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  )

  // ── Resolve slug filters to ids ──────────────────────────────────────────────
  function parseSlugList(raw: string | null): string[] {
    if (!raw) return []
    return raw.split(',').map(s => s.trim()).filter(Boolean)
  }

  const industrySlugs = parseSlugList(industry)
  const catSlugs      = parseSlugList(cat)
  const countrySlugs  = parseSlugList(country)

  let industryIds: string[] = []
  let categoryIds: string[] = []
  let countryIds: string[]  = []

  if (industrySlugs.length > 0) {
    const { data } = await supabase.from('industries').select('id').in('slug', industrySlugs)
    industryIds = (data ?? []).map(row => row.id)
  }
  if (catSlugs.length > 0) {
    const { data } = await supabase.from('categories').select('id').in('slug', catSlugs)
    categoryIds = (data ?? []).map(row => row.id)
  }
  if (countrySlugs.length > 0) {
    const { data } = await supabase.from('countries').select('id').in('slug', countrySlugs)
    countryIds = (data ?? []).map(row => row.id)
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
    ? '*, listing_images(*), countries(name, iso_code), states(latitude, longitude)'
    : '*, listing_images(*), countries(name, iso_code)'

  // ── Helper: base query with all non-FTS filters applied ─────────────────────
  // Returns 'any' because each Supabase chain call narrows the TS return type,
  // making a truly generic helper impractical. We apply FTS on top externally.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function filteredBase(): any {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q: any = supabase
      .from('listings')
      .select(SELECT_COLUMNS)
      .eq('status', 'active')

    if (category)      q = q.eq('category', category)
    if (industryIds.length) q = q.in('industry_id', industryIds)
    if (categoryIds.length) q = q.in('category_id', categoryIds)
    if (countryIds.length)  q = q.in('country_id', countryIds)
    if (tier)       q = q.eq('tier', tier)

    return q
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
    const tsQuery   = strippedQ ? buildTsQuery(strippedQ) : ''

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

    if (s1Result.error) {
      return NextResponse.json({ error: s1Result.error.message }, { status: 500 })
    }

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

    return NextResponse.json({
      listings: merged,
      total: merged.length,
      limit,
      offset,
      ...(isClosest ? { locationUnavailable } : {}),
    })
  }

  // ── No search query — single query with exact count + cursor pagination ──────
  let query = supabase
    .from('listings')
    .select(SELECT_COLUMNS, { count: 'exact' })
    .eq('status', 'active')

  if (category)      query = query.eq('category', category)
  if (industryIds.length) query = query.in('industry_id', industryIds)
  if (categoryIds.length) query = query.in('category_id', categoryIds)
  if (countryIds.length)  query = query.in('country_id', countryIds)
  if (tier)       query = query.eq('tier', tier)

  // "Closest to Me" needs the full matching set in memory to sort by distance —
  // pagination is applied after sorting instead of via .range().
  if (isClosest) {
    const { data, error, count } = await query.order(sortField, { ascending })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const sorted = sortByDistance((data ?? []) as unknown as ListingRow[])
    const page = sorted.slice(offset, offset + limit)

    return NextResponse.json({ listings: page, total: count, limit, offset, locationUnavailable })
  }

  query = query.order(sortField, { ascending }).range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ listings: data, total: count, limit, offset })
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet: { name: string; value: string; options: CookieOptions }[]) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { title, description, category, manufacturer, model, year, condition, price, price_negotiable, location_city, location_state } = body

  if (!title || !category || price == null) {
    return NextResponse.json({ error: 'title, category, and price are required' }, { status: 400 })
  }

  if (typeof price !== 'number' || price <= 0) {
    return NextResponse.json({ error: 'price must be a positive number' }, { status: 400 })
  }

  const { category_id, industry_id } = await resolveCategoryAndIndustryIds(supabase, title, category)

  const { data, error } = await supabase
    .from('listings')
    .insert({
      seller_id: user.id,
      title,
      description,
      category,
      category_id,
      industry_id,
      manufacturer,
      model,
      year,
      condition,
      price,
      price_negotiable: price_negotiable ?? false,
      location_city,
      location_state,
      status: 'pending_review',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ listing: data }, { status: 201 })
}
