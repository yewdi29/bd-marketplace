import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { buildTsQuery, stripMeasurements } from '@/lib/searchSynonyms'

// Columns that can be used as sort keys — prevents injecting arbitrary column names
const ALLOWED_SORT_FIELDS = ['created_at', 'price'] as const

// Price range boundaries
const PRICE_RANGES: Record<string, { gte?: number; lte?: number; gt?: number; lt?: number }> = {
  under_50k:  { lt: 50_000 },
  '50k_200k': { gte: 50_000,  lte: 200_000 },
  '200k_500k':{ gte: 200_000, lte: 500_000 },
  over_500k:  { gt: 500_000 },
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const category   = searchParams.get('category')
  const tier       = searchParams.get('tier')
  const q          = searchParams.get('q')
  const conditions = searchParams.get('conditions')   // comma-separated: "new,like_new"
  const priceRange = searchParams.get('priceRange')   // e.g. "under_50k"
  const state      = searchParams.get('state')        // e.g. "TX"
  const sort       = searchParams.get('sort') ?? 'created_at:desc'
  const limit      = Math.min(parseInt(searchParams.get('limit') ?? '24'), 100)
  const offset     = parseInt(searchParams.get('offset') ?? '0')

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

  // ── Sort params (shared by both search paths) ───────────────────────────────
  const [rawField, rawDir] = sort.split(':')
  const sortField = (ALLOWED_SORT_FIELDS as readonly string[]).includes(rawField)
    ? rawField : 'created_at'
  const ascending = rawDir === 'asc'

  // ── Helper: base query with all non-FTS filters applied ─────────────────────
  // Returns 'any' because each Supabase chain call narrows the TS return type,
  // making a truly generic helper impractical. We apply FTS on top externally.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function filteredBase(): any {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q: any = supabase
      .from('listings')
      .select('*, listing_images(*)')
      .eq('status', 'active')

    if (category) q = q.eq('category', category)
    if (tier)     q = q.eq('tier', tier)
    if (state)    q = q.eq('location_state', state)

    if (conditions) {
      const list = conditions.split(',').map((c: string) => c.trim()).filter(Boolean)
      if (list.length) q = q.in('condition', list)
    }

    if (priceRange && PRICE_RANGES[priceRange]) {
      const range = PRICE_RANGES[priceRange]
      if (range.lt  != null) q = q.lt('price', range.lt)
      if (range.lte != null) q = q.lte('price', range.lte)
      if (range.gte != null) q = q.gte('price', range.gte)
      if (range.gt  != null) q = q.gt('price', range.gt)
    }

    return q
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
    const merged = [
      ...stage1,
      ...stage2.filter((r: { id: string }) => !stage1Ids.has(r.id)),
    ].slice(0, limit)

    return NextResponse.json({ listings: merged, total: merged.length, limit, offset })
  }

  // ── No search query — single query with exact count + cursor pagination ──────
  let query = supabase
    .from('listings')
    .select('*, listing_images(*)', { count: 'exact' })
    .eq('status', 'active')

  if (category) query = query.eq('category', category)
  if (tier)     query = query.eq('tier', tier)
  if (state)    query = query.eq('location_state', state)

  if (conditions) {
    const conditionList = conditions.split(',').map(c => c.trim()).filter(Boolean)
    if (conditionList.length) query = query.in('condition', conditionList)
  }

  if (priceRange && PRICE_RANGES[priceRange]) {
    const range = PRICE_RANGES[priceRange]
    if (range.lt  != null) query = query.lt('price', range.lt)
    if (range.lte != null) query = query.lte('price', range.lte)
    if (range.gte != null) query = query.gte('price', range.gte)
    if (range.gt  != null) query = query.gt('price', range.gt)
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

  const { data, error } = await supabase
    .from('listings')
    .insert({
      seller_id: user.id,
      title,
      description,
      category,
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
