import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { canManageListingMedia } from '@/lib/listings/canManageListingMedia'
import { isGalleryVideoStatus } from '@/lib/listings/galleryPosition'

type Params = { params: { id: string } }

type GalleryOrderEntry = { type: 'photo' | 'video'; id: string }

function makeClients(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  return { authClient, adminClient }
}

// PATCH /api/listings/[id]/gallery-order
export async function PATCH(request: NextRequest, { params }: Params) {
  const cookieStore = await cookies()
  const { authClient, adminClient } = makeClients(cookieStore)

  const {
    data: { user },
  } = await authClient.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const listingId = params.id
  const allowed = await canManageListingMedia(authClient, listingId, user.id)
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = (await request.json()) as { gallery_order?: GalleryOrderEntry[] }
  const galleryOrder = body.gallery_order
  if (!Array.isArray(galleryOrder) || galleryOrder.length === 0) {
    return NextResponse.json({ error: 'gallery_order is required' }, { status: 400 })
  }

  const [{ data: images }, { data: videos }] = await Promise.all([
    adminClient
      .from('listing_images')
      .select('id, gallery_position, sort_order, is_primary')
      .eq('listing_id', listingId),
    adminClient
      .from('listing_videos')
      .select('id, gallery_position, status')
      .eq('listing_id', listingId),
  ])

  const imageMap = new Map((images ?? []).map((row) => [row.id, row]))
  const videoMap = new Map((videos ?? []).map((row) => [row.id, row]))

  for (const entry of galleryOrder) {
    if (entry.type !== 'photo' && entry.type !== 'video') {
      return NextResponse.json({ error: 'Invalid gallery_order entry' }, { status: 400 })
    }
    if (entry.type === 'photo' && !imageMap.has(entry.id)) {
      return NextResponse.json({ error: 'Invalid photo in gallery_order' }, { status: 400 })
    }
    if (entry.type === 'video') {
      const video = videoMap.get(entry.id)
      if (!video || !isGalleryVideoStatus(video.status)) {
        return NextResponse.json({ error: 'Invalid video in gallery_order' }, { status: 400 })
      }
    }
  }

  let photoSortIndex = 0

  for (let galleryPosition = 0; galleryPosition < galleryOrder.length; galleryPosition++) {
    const entry = galleryOrder[galleryPosition]

    if (entry.type === 'photo') {
      const current = imageMap.get(entry.id)!
      const nextSortOrder = photoSortIndex
      const nextIsPrimary = photoSortIndex === 0
      photoSortIndex += 1

      if (
        current.gallery_position !== galleryPosition ||
        current.sort_order !== nextSortOrder ||
        current.is_primary !== nextIsPrimary
      ) {
        const { error } = await adminClient
          .from('listing_images')
          .update({
            gallery_position: galleryPosition,
            sort_order: nextSortOrder,
            is_primary: nextIsPrimary,
          })
          .eq('id', entry.id)
          .eq('listing_id', listingId)

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }
      }
      continue
    }

    const current = videoMap.get(entry.id)!
    if (current.gallery_position !== galleryPosition) {
      const { error } = await adminClient
        .from('listing_videos')
        .update({ gallery_position: galleryPosition })
        .eq('id', entry.id)
        .eq('listing_id', listingId)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }
  }

  return NextResponse.json({ success: true })
}
