import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { appendFileSync } from 'fs'
import { join } from 'path'
import { canManageListingMedia } from '@/lib/listings/canManageListingMedia'
import {
  ACTIVE_LISTING_VIDEO_STATUSES,
  MAX_LISTING_VIDEOS,
  nextAvailableVideoPosition,
} from '@/lib/listings/listingVideoUpload'
import { getMuxClient } from '@/lib/mux/client'
import { nextGalleryPosition } from '@/lib/listings/galleryPosition'
import { createServiceClient } from '@/lib/rigburrito/service'

type Params = { params: { id: string } }

function muxCorsOrigin(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
}

function isDuplicatePositionError(message: string): boolean {
  return message.includes('listing_videos_listing_position_active_idx')
}

function debugLog(payload: Record<string, unknown>) {
  try {
    appendFileSync(
      join(process.cwd(), '.cursor/debug-ddf04d.log'),
      `${JSON.stringify({ sessionId: 'ddf04d', timestamp: Date.now(), ...payload })}\n`,
    )
  } catch {
    // ignore logging failures
  }
}

async function fetchUsedVideoPositions(
  service: ReturnType<typeof createServiceClient>,
  listingId: string,
): Promise<{ usedPositions: number[]; error: string | null }> {
  const { data: activeVideos, error: videosError } = await service
    .from('listing_videos')
    .select('position')
    .eq('listing_id', listingId)
    .in('status', [...ACTIVE_LISTING_VIDEO_STATUSES])

  if (videosError) {
    return { usedPositions: [], error: videosError.message }
  }

  return { usedPositions: (activeVideos ?? []).map((row) => row.position), error: null }
}

// POST /api/listings/[id]/videos/upload-url
// Creates a listing_videos row and returns a Mux direct-upload URL for Phase 3.
export async function POST(_request: NextRequest, { params }: Params) {
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

  const allowed = await canManageListingMedia(authClient, listingId, user.id)
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: listing } = await authClient
    .from('listings')
    .select('id')
    .eq('id', listingId)
    .maybeSingle()

  if (!listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  }

  const service = createServiceClient()
  const { usedPositions, error: videosError } = await fetchUsedVideoPositions(service, listingId)

  if (videosError) {
    return NextResponse.json({ error: videosError }, { status: 500 })
  }

  if (usedPositions.length >= MAX_LISTING_VIDEOS) {
    return NextResponse.json(
      { error: `Maximum of ${MAX_LISTING_VIDEOS} videos per listing` },
      { status: 400 },
    )
  }

  const galleryPosition = await nextGalleryPosition(service, listingId)

  let position = nextAvailableVideoPosition(usedPositions)
  debugLog({
    location: 'upload-url/route.ts:pre-insert',
    message: 'position assignment',
    hypothesisId: 'B-C-E',
    runId: 'post-fix-v2',
    data: { listingId, usedPositions, chosenPosition: position, activeVideoCount: usedPositions.length },
  })
  // #region agent log
  fetch('http://127.0.0.1:7549/ingest/70669dba-0168-46fd-8502-7486147bdfd7',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'ddf04d'},body:JSON.stringify({sessionId:'ddf04d',location:'upload-url/route.ts:pre-insert',message:'position assignment',data:{listingId,usedPositions,chosenPosition:position,activeVideoCount:usedPositions.length},timestamp:Date.now(),hypothesisId:'B-C-E',runId:'post-fix-v2'})}).catch(()=>{});
  // #endregion
  if (position === null) {
    return NextResponse.json(
      { error: `Maximum of ${MAX_LISTING_VIDEOS} videos per listing` },
      { status: 400 },
    )
  }

  let videoRow: { id: string; position: number; gallery_position: number | null } | null = null
  let insertError: { message: string; code?: string } | null = null

  for (let attempt = 0; attempt < 2; attempt++) {
    const result = await service
      .from('listing_videos')
      .insert({
        listing_id: listingId,
        status: 'uploading',
        position,
        gallery_position: galleryPosition,
      })
      .select('id, position, gallery_position')
      .single()

    videoRow = result.data
    insertError = result.error

    if (!insertError) break

    if (attempt === 0 && isDuplicatePositionError(insertError.message)) {
      const retry = await fetchUsedVideoPositions(service, listingId)
      if (retry.error) {
        return NextResponse.json({ error: retry.error }, { status: 500 })
      }
      position = nextAvailableVideoPosition(retry.usedPositions)
      if (position === null) {
        return NextResponse.json(
          { error: `Maximum of ${MAX_LISTING_VIDEOS} videos per listing` },
          { status: 400 },
        )
      }
      continue
    }

    break
  }

  if (insertError || !videoRow) {
    debugLog({
      location: 'upload-url/route.ts:insert-error',
      message: 'insert failed',
      hypothesisId: 'B-C-E',
      runId: 'post-fix-v2',
      data: { listingId, position, error: insertError?.message ?? 'unknown', code: insertError?.code },
    })
    // #region agent log
    fetch('http://127.0.0.1:7549/ingest/70669dba-0168-46fd-8502-7486147bdfd7',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'ddf04d'},body:JSON.stringify({sessionId:'ddf04d',location:'upload-url/route.ts:insert-error',message:'insert failed',data:{listingId,position,error:insertError?.message??'unknown',code:insertError?.code},timestamp:Date.now(),hypothesisId:'B-C-E',runId:'post-fix-v2'})}).catch(()=>{});
    // #endregion
    const isCapViolation = insertError?.message.includes('more than 3 active videos')
    return NextResponse.json(
      {
        error: isCapViolation
          ? `Maximum of ${MAX_LISTING_VIDEOS} videos per listing`
          : insertError?.message ?? 'Failed to create video row',
      },
      { status: isCapViolation ? 400 : 500 },
    )
  }

  try {
    const mux = getMuxClient()
    const upload = await mux.video.uploads.create({
      cors_origin: muxCorsOrigin(),
      new_asset_settings: {
        passthrough: videoRow.id,
        playback_policies: ['public'],
        video_quality: 'basic',
      },
    })

    if (!upload.url) {
      throw new Error('Mux did not return an upload URL')
    }

    return NextResponse.json({
      success: true,
      video: {
        id: videoRow.id,
        position: videoRow.position,
        gallery_position: videoRow.gallery_position,
      },
      uploadUrl: upload.url,
      muxUploadId: upload.id,
    })
  } catch (err) {
    await service.from('listing_videos').delete().eq('id', videoRow.id)

    const message = err instanceof Error ? err.message : 'Failed to create Mux upload URL'
    console.error('[listings/videos/upload-url] Mux upload creation failed', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
