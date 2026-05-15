import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

type Params = { params: { id: string } }

// POST /api/listings/[id]/images
// Accepts multipart/form-data with a single `file` field.
// Uploads to Supabase Storage bucket `listing-images` at path `{listing_id}/{filename}`.
// Inserts a record in listing_images and returns { image: { id, url } }.
export async function POST(request: NextRequest, { params }: Params) {
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

  // Ownership check
  const { data: listing } = await adminClient
    .from('listings')
    .select('seller_id')
    .eq('id', params.id)
    .single()

  if (!listing || listing.seller_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Check photo count limit
  const { count: existingCount } = await adminClient
    .from('listing_images')
    .select('id', { count: 'exact', head: true })
    .eq('listing_id', params.id)

  if ((existingCount ?? 0) >= 20) {
    return NextResponse.json({ error: 'Maximum of 20 photos per listing' }, { status: 400 })
  }

  // Parse multipart form data
  const form = await request.formData()
  const file = form.get('file') as File | null

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const bytes = await file.arrayBuffer()
  const buffer = new Uint8Array(bytes)

  // Build a safe, unique storage path
  const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase().replace(/[^a-z]/g, '')
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const storagePath = `${params.id}/${safeName}`

  const { error: uploadError } = await adminClient.storage
    .from('listing-images')
    .upload(storagePath, buffer, { contentType: file.type, upsert: false })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: { publicUrl } } = adminClient.storage
    .from('listing-images')
    .getPublicUrl(storagePath)

  // First image in this listing is auto-primary
  const isPrimary = (existingCount ?? 0) === 0

  const { data: imgRecord, error: insertError } = await adminClient
    .from('listing_images')
    .insert({
      listing_id: params.id,
      storage_path: storagePath,
      url: publicUrl,
      sort_order: existingCount ?? 0,
      is_primary: isPrimary,
    })
    .select('id, url')
    .single()

  if (insertError) {
    // Clean up orphaned storage file
    await adminClient.storage.from('listing-images').remove([storagePath])
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ image: imgRecord }, { status: 201 })
}

// DELETE /api/listings/[id]/images?imageId={imageId}
// Removes a single image from Storage and the listing_images table.
// Recalculates is_primary (lowest sort_order wins) after deletion.
export async function DELETE(request: NextRequest, { params }: Params) {
  const { searchParams } = new URL(request.url)
  const imageId = searchParams.get('imageId')
  if (!imageId) return NextResponse.json({ error: 'imageId is required' }, { status: 400 })

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

  // Get the image record
  const { data: img } = await adminClient
    .from('listing_images')
    .select('storage_path')
    .eq('id', imageId)
    .eq('listing_id', params.id)
    .single()

  if (!img) return NextResponse.json({ error: 'Image not found' }, { status: 404 })

  // Remove from Storage
  await adminClient.storage.from('listing-images').remove([img.storage_path])

  // Delete DB record
  await adminClient.from('listing_images').delete().eq('id', imageId)

  // Recalculate is_primary — set it on the image with lowest sort_order
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
