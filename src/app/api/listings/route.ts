import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { resolveCategoryAndIndustryIds } from '@/lib/categoryResolver'
import { orgFieldsForNewListing } from '@/lib/listings/orgFieldsForNewListing'
import { scheduleListingVerification } from '@/lib/listings/scheduleListingVerification'
import { queryPublicListings } from '@/lib/listings/queryPublicListings'

function failListings(error: unknown) {
  console.error(error)
  return NextResponse.json({ error: 'Failed to load listings' }, { status: 500 })
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

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

  try {
    const result = await queryPublicListings(supabase, {
      category: searchParams.get('category'),
      industry: searchParams.get('industry'),
      cat: searchParams.get('cat'),
      country: searchParams.get('country'),
      tier: searchParams.get('tier'),
      q: searchParams.get('q'),
      sort: searchParams.get('sort') ?? 'created_at:desc',
      lat: searchParams.get('lat'),
      lng: searchParams.get('lng'),
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
    })
    return NextResponse.json(result)
  } catch (error) {
    return failListings(error)
  }
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
  const orgFields = await orgFieldsForNewListing(user.id)

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
      ...orgFields,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Legacy create-as-pending_review path (INSERT). App-side trigger is primary;
  // Supabase DB webhooks only listen for UPDATE, so this is required here.
  scheduleListingVerification(data.id, { previousStatus: null })

  return NextResponse.json({ listing: data }, { status: 201 })
}
