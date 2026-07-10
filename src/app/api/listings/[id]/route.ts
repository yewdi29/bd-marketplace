import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { resolveCategoryAndIndustryIds } from '@/lib/categoryResolver'
import { applyTaxonomyFieldsToUpdates } from '@/lib/listingTaxonomyUpdate'
import { applyMajorChangeReview } from '@/lib/listings/applyMajorChangeReview'
import type { ListingChangeSnapshot } from '@/lib/listings/detectMajorChange'

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

  // Ownership check — fetch fields needed for major-change detection
  const { data: listing } = await adminClient
    .from('listings')
    .select(`
      seller_id, title, category, status, description, price, condition,
      location_city, location_state, country_id, industry_id, category_id,
      listing_images(id)
    `)
    .eq('id', params.id)
    .single()

  if (!listing || listing.seller_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const statusBeforeEdit = listing.status as string
  const oldSnapshot: ListingChangeSnapshot = {
    title: listing.title,
    description: listing.description,
    price: listing.price,
    location_city: listing.location_city,
    location_state: listing.location_state,
    country_id: listing.country_id,
    category_id: listing.category_id,
    industry_id: listing.industry_id,
    condition: listing.condition,
    listing_images: listing.listing_images as { id: string }[] | null,
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
    'country_id', 'region_id', 'state_id',
    'industry_id', 'category_id',
    'description', 'tags', 'specs', 'video_url', 'status',
  ]

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of allowed) {
    if (key in fields) updates[key] = fields[key]
  }

  // Merge specs patches so seller_prompt is preserved alongside other spec keys
  if ('specs' in fields && fields.specs !== null && typeof fields.specs === 'object') {
    const { data: currentRow } = await adminClient
      .from('listings')
      .select('specs')
      .eq('id', params.id)
      .single()
    const existing = (currentRow?.specs as Record<string, unknown> | null) ?? {}
    updates.specs = { ...existing, ...(fields.specs as Record<string, unknown>) }
  }

  // Coerce numeric fields
  if ('price' in updates) updates.price = Number(updates.price) || 0
  if ('year' in updates) updates.year = updates.year ? Number(updates.year) : null

  await applyTaxonomyFieldsToUpdates(adminClient, fields, updates)

  // Re-derive category_id/industry_id from title/category when taxonomy IDs not sent
  if (
    !('industry_id' in fields) &&
    !('category_id' in fields) &&
    ('title' in updates || 'category' in updates)
  ) {
    const effectiveTitle    = (updates.title as string | undefined)    ?? listing.title
    const effectiveCategory = (updates.category as string | undefined) ?? listing.category
    const { category_id, industry_id } = await resolveCategoryAndIndustryIds(
      adminClient, effectiveTitle, effectiveCategory
    )
    updates.category_id = category_id
    updates.industry_id = industry_id
  } else if (
    ('title' in updates || 'category' in updates) &&
    !('category_id' in fields)
  ) {
    const effectiveTitle    = (updates.title as string | undefined)    ?? listing.title
    const effectiveCategory = (updates.category as string | undefined) ?? listing.category
    const { category_id, industry_id } = await resolveCategoryAndIndustryIds(
      adminClient, effectiveTitle, effectiveCategory
    )
    updates.category_id = category_id
    updates.industry_id = industry_id
  }

  // Only update the listing row if there are field changes beyond updated_at
  if (Object.keys(updates).length > 1) {
    const { error } = await adminClient
      .from('listings')
      .update(updates)
      .eq('id', params.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: updatedListing } = await adminClient
    .from('listings')
    .select(`
      title, description, price, condition,
      location_city, location_state, country_id, industry_id, category_id,
      listing_images(id)
    `)
    .eq('id', params.id)
    .single()

  if (updatedListing) {
    const newSnapshot: ListingChangeSnapshot = {
      title: updatedListing.title,
      description: updatedListing.description,
      price: updatedListing.price,
      location_city: updatedListing.location_city,
      location_state: updatedListing.location_state,
      country_id: updatedListing.country_id,
      category_id: updatedListing.category_id,
      industry_id: updatedListing.industry_id,
      condition: updatedListing.condition,
      listing_images: updatedListing.listing_images as { id: string }[] | null,
    }

    await applyMajorChangeReview(
      adminClient,
      params.id,
      oldSnapshot,
      newSnapshot,
      statusBeforeEdit,
    )
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
