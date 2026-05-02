import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const tier = searchParams.get('tier')
  const q = searchParams.get('q')
  const sort = searchParams.get('sort') ?? 'created_at:desc'
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '24'), 100)
  const offset = parseInt(searchParams.get('offset') ?? '0')

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

  let query = supabase
    .from('listings')
    .select('*, listing_images(*)', { count: 'exact' })
    .eq('status', 'active')

  if (category) query = query.eq('category', category)
  if (tier) query = query.eq('tier', tier)
  if (q) query = query.ilike('title', `%${q}%`)

  const [sortField, sortDir] = sort.split(':')
  query = query
    .order(sortField, { ascending: sortDir === 'asc' })
    .range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

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
