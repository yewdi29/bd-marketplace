import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

type Params = { params: { listing_id: string } }

async function getUser(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  return authClient.auth.getUser()
}

// POST /api/saved/[listing_id] — save a listing
export async function POST(_req: NextRequest, { params }: Params) {
  const cookieStore = await cookies()
  const { data: { user } } = await getUser(cookieStore)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await adminClient
    .from('saved_listings')
    .upsert({ user_id: user.id, listing_id: params.listing_id }, { onConflict: 'user_id,listing_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// DELETE /api/saved/[listing_id] — unsave a listing
export async function DELETE(_req: NextRequest, { params }: Params) {
  const cookieStore = await cookies()
  const { data: { user } } = await getUser(cookieStore)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await adminClient
    .from('saved_listings')
    .delete()
    .eq('user_id', user.id)
    .eq('listing_id', params.listing_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
