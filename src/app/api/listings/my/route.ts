import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(_request: NextRequest) {
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

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('listings')
    .select('id, title, category, price, status, slug, created_at, listing_images(url, is_primary, sort_order)')
    .eq('seller_id', user.id)
    .neq('status', 'removed')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const listings = (data ?? []).map(listing => {
    const imgs = (listing.listing_images ?? []) as { url: string; is_primary: boolean; sort_order: number }[]
    const primary = imgs.find(i => i.is_primary) ?? imgs.sort((a, b) => a.sort_order - b.sort_order)[0] ?? null
    return {
      id: listing.id,
      title: listing.title,
      category: listing.category,
      price: listing.price,
      status: listing.status,
      slug: listing.slug,
      created_at: listing.created_at,
      primary_image_url: primary?.url ?? null,
    }
  })

  return NextResponse.json({ listings })
}
