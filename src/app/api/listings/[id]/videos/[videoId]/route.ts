import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { canManageListingMedia } from '@/lib/listings/canManageListingMedia'
import { deleteMuxAsset } from '@/lib/mux/deleteAsset'
import { createServiceClient } from '@/lib/rigburrito/service'

type Params = { params: { id: string; videoId: string } }

// DELETE /api/listings/[id]/videos/[videoId]
export async function DELETE(_request: NextRequest, { params }: Params) {
  const cookieStore = await cookies()
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )

  const {
    data: { user },
  } = await authClient.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const listingId = params.id
  const videoId = params.videoId

  const allowed = await canManageListingMedia(authClient, listingId, user.id)
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const service = createServiceClient()
  const { data: video, error: fetchError } = await service
    .from('listing_videos')
    .select('id, mux_asset_id')
    .eq('id', videoId)
    .eq('listing_id', listingId)
    .maybeSingle()

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  if (!video) {
    return NextResponse.json({ error: 'Video not found' }, { status: 404 })
  }

  if (video.mux_asset_id) {
    try {
      await deleteMuxAsset(video.mux_asset_id)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete Mux asset'
      console.error('[listings/videos/delete] Mux asset deletion failed', err)
      return NextResponse.json({ error: message }, { status: 500 })
    }
  }

  const { error: deleteError } = await service
    .from('listing_videos')
    .delete()
    .eq('id', videoId)
    .eq('listing_id', listingId)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
