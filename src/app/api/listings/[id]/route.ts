import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

type Params = { params: { id: string } }

function makeClients(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  return { authClient, adminClient }
}

// PATCH /api/listings/[id]
// Updates listing fields. Also handles:
//   - status updates (draft, pending_review)
//   - image reordering via image_order: string[] (array of image IDs in display order)
export async function PATCH(request: NextRequest, { params }: Params) {
  const cookieStore = await cookies()
  const { authClient, adminClient } = makeClients(cookieStore)

  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Ownership check
  const { data: listing } = await adminClient
    .from('listings')
    .select('seller_id')
    .eq('id', params.id)
    .single()

  if (!listing || listing.seller_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json() as Record<string, unknown>
  const { image_order, ...fields } = body

  // If image_order provided, update sort_order and is_primary on listing_images
  if (Array.isArray(image_order) && image_order.length > 0) {
    for (let i = 0; i < image_order.length; i++) {
      await adminClient
        .from('listing_images')
        .update({ sort_order: i, is_primary: i === 0 })
        .eq('id', image_order[i])
        .eq('listing_id', params.id)
    }
  }

  // Build listing update payload — only include known, safe fields
  const allowed = [
    'title', 'category', 'manufacturer', 'model', 'year', 'condition',
    'price', 'price_unit', 'price_visible', 'price_negotiable',
    'location_city', 'location_state',
    'description', 'tags', 'specs', 'video_url', 'status',
  ]

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of allowed) {
    if (key in fields) updates[key] = fields[key]
  }

  // Coerce numeric fields
  if ('price' in updates) updates.price = Number(updates.price) || 0
  if ('year' in updates) updates.year = updates.year ? Number(updates.year) : null

  // Only update the listing row if there are field changes beyond updated_at
  if (Object.keys(updates).length > 1) {
    const { error } = await adminClient
      .from('listings')
      .update(updates)
      .eq('id', params.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// DELETE /api/listings/[id]
// Discards a draft listing: removes all Storage files, then deletes the listing row
// (listing_images cascade on listing delete).
// Only allowed on listings with status = 'draft'.
export async function DELETE(_request: NextRequest, { params }: Params) {
  const cookieStore = await cookies()
  const { authClient, adminClient } = makeClients(cookieStore)

  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: listing } = await adminClient
    .from('listings')
    .select('seller_id, status')
    .eq('id', params.id)
    .single()

  if (!listing || listing.seller_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (listing.status !== 'draft') {
    return NextResponse.json({ error: 'Only draft listings can be discarded' }, { status: 400 })
  }

  // Remove all images from Supabase Storage
  const { data: storageFiles } = await adminClient.storage
    .from('listing-images')
    .list(params.id)

  if (storageFiles && storageFiles.length > 0) {
    const paths = storageFiles.map(f => `${params.id}/${f.name}`)
    await adminClient.storage.from('listing-images').remove(paths)
  }

  // Delete listing row — listing_images records cascade automatically
  const { error } = await adminClient
    .from('listings')
    .delete()
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
