import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { getActiveOrgMembership } from '@/lib/organizations/auth'

export async function GET(_request: Request) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const membership = await getActiveOrgMembership(user.id)

  // Use service role for org dashboards so company listings are visible even when
  // organization_id was never stamped (RLS org policies require organization_id).
  const db = membership
    ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    : supabase

  let query = db
    .from('listings')
    .select(`
      id, title, category, price, price_unit, price_visible, status, slug,
      seller_id, organization_id, posted_by_user_id, created_at, updated_at,
      location_city, location_state, last_approved_at, specs,
      listing_images(url, is_primary, sort_order),
      poster:posted_by_user_id(full_name, email)
    `)
    .neq('status', 'removed')

  if (membership) {
    const { data: members } = await db
      .from('org_members')
      .select('user_id')
      .eq('organization_id', membership.organization_id)
      .eq('status', 'active')

    const memberIds = (members ?? [])
      .map(m => m.user_id)
      .filter((id): id is string => Boolean(id))

    if (memberIds.length === 0) {
      memberIds.push(user.id)
    }

    const memberFilter = memberIds.map(id => `seller_id.eq.${id}`).join(',')
    query = query.or(
      `organization_id.eq.${membership.organization_id},${memberFilter}`,
    )
  } else {
    query = query.eq('seller_id', user.id)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const listings = (data ?? []).map(listing => {
    const imgs = (listing.listing_images ?? []) as { url: string; is_primary: boolean; sort_order: number }[]
    const primary = imgs.find(i => i.is_primary) ?? imgs.sort((a, b) => a.sort_order - b.sort_order)[0] ?? null
    const specs = listing.specs as Record<string, string> | null
    const poster = listing.poster as unknown as { full_name: string | null; email: string } | null

    return {
      id: listing.id,
      title: listing.title,
      category: listing.category,
      price: listing.price,
      price_unit: listing.price_unit ?? 'total',
      price_visible: listing.price_visible,
      status: listing.status,
      slug: listing.slug,
      seller_id: listing.seller_id,
      organization_id: listing.organization_id,
      posted_by_user_id: listing.posted_by_user_id,
      created_at: listing.created_at,
      updated_at: listing.updated_at,
      location_city: listing.location_city ?? null,
      location_state: listing.location_state ?? null,
      last_approved_at: listing.last_approved_at ?? null,
      primary_image_url: primary?.url ?? null,
      seller_prompt: specs?.seller_prompt ?? null,
      posted_by_name: poster?.full_name ?? null,
      posted_by_email: poster?.email ?? null,
    }
  })

  return NextResponse.json({ listings })
}
