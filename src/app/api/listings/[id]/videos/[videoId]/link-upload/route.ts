import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { canManageListingMedia } from '@/lib/listings/canManageListingMedia'
import { linkListingVideoFromMuxUpload } from '@/lib/mux/linkListingVideoUpload'
import { createServiceClient } from '@/lib/rigburrito/service'

type Params = { params: { id: string; videoId: string } }

// POST /api/listings/[id]/videos/[videoId]/link-upload
// Called by the browser after PUT to Mux completes — links upload → asset in Supabase.
export async function POST(request: NextRequest, { params }: Params) {
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

  const { id: listingId, videoId } = params
  const allowed = await canManageListingMedia(authClient, listingId, user.id)
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = (await request.json()) as { muxUploadId?: string }
  if (!body.muxUploadId) {
    return NextResponse.json({ error: 'muxUploadId is required' }, { status: 400 })
  }

  const service = createServiceClient()
  const { data: row } = await service
    .from('listing_videos')
    .select('id')
    .eq('id', videoId)
    .eq('listing_id', listingId)
    .maybeSingle()

  if (!row) {
    return NextResponse.json({ error: 'Video not found' }, { status: 404 })
  }

  const result = await linkListingVideoFromMuxUpload(service, videoId, body.muxUploadId)

  return NextResponse.json({ success: true, outcome: result.outcome })
}
