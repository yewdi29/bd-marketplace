import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

type Params = { params: { id: string; image_id: string } }

// DELETE /api/listings/[id]/images/[image_id]
// Validates seller ownership, removes the image from Supabase Storage,
// deletes the listing_images record, then recalculates is_primary.
export async function DELETE(_request: NextRequest, { params }: Params) {
  const cookieStore = await cookies()
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Ownership check via listing
  const { data: listing } = await adminClient
    .from('listings')
    .select('seller_id')
    .eq('id', params.id)
    .single()

  if (!listing || listing.seller_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Get the image record to find its storage path
  const { data: img } = await adminClient
    .from('listing_images')
    .select('storage_path')
    .eq('id', params.image_id)
    .eq('listing_id', params.id)
    .single()

  if (!img) return NextResponse.json({ error: 'Image not found' }, { status: 404 })

  // Remove from Supabase Storage
  await adminClient.storage.from('listing-images').remove([img.storage_path])

  // Delete the DB record
  await adminClient.from('listing_images').delete().eq('id', params.image_id)

  // Recalculate is_primary — lowest sort_order remaining becomes primary
  const { data: remaining } = await adminClient
    .from('listing_images')
    .select('id')
    .eq('listing_id', params.id)
    .order('sort_order', { ascending: true })
    .limit(1)

  if (remaining && remaining.length > 0) {
    await adminClient
      .from('listing_images')
      .update({ is_primary: true })
      .eq('id', remaining[0].id)
  }

  return NextResponse.json({ success: true })
}
