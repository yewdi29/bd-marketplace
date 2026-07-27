import type { SupabaseClient } from '@supabase/supabase-js'
import {
  MAX_VIDEO_DURATION_SECONDS,
  VIDEO_TOO_LONG_REJECTION_REASON,
} from '@/lib/listings/listingVideoUpload'
import { deleteMuxAsset } from '@/lib/mux/deleteAsset'
import { getMuxClient } from '@/lib/mux/client'

export type SyncListingVideoResult =
  | { outcome: 'ready'; playbackId: string }
  | { outcome: 'processing' }
  | { outcome: 'rejected_too_long' }
  | { outcome: 'error'; reason: string }
  | { outcome: 'not_found' }

function extractPublicPlaybackId(
  playbackIds: Array<{ id?: string; policy?: string }> | null | undefined,
): string | null {
  if (!playbackIds?.length) return null
  const pub = playbackIds.find((entry) => entry.policy === 'public' && entry.id)
  return pub?.id ?? playbackIds[0]?.id ?? null
}

/** Pull current Mux asset state and mirror it onto listing_videos (webhook fallback). */
export async function syncListingVideoFromMuxAsset(
  service: SupabaseClient,
  listingVideoId: string,
  assetId: string,
): Promise<SyncListingVideoResult> {
  const { data: row } = await service
    .from('listing_videos')
    .select('id, status, mux_playback_id')
    .eq('id', listingVideoId)
    .maybeSingle()

  if (!row) return { outcome: 'not_found' }
  if (row.status === 'ready' && row.mux_playback_id) {
    return { outcome: 'ready', playbackId: row.mux_playback_id }
  }

  let asset
  try {
    asset = await getMuxClient().video.assets.retrieve(assetId)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not read Mux asset'
    return { outcome: 'error', reason: message }
  }

  const duration = asset.duration ?? 0
  const assetStatus = asset.status

  if (assetStatus === 'ready') {
    if (duration > MAX_VIDEO_DURATION_SECONDS) {
      try {
        await deleteMuxAsset(assetId)
      } catch {
        // best effort
      }

      await service
        .from('listing_videos')
        .update({
          mux_asset_id: assetId,
          status: 'rejected_too_long',
          rejection_reason: VIDEO_TOO_LONG_REJECTION_REASON,
          duration_seconds: duration,
          gallery_position: null,
        })
        .eq('id', listingVideoId)

      return { outcome: 'rejected_too_long' }
    }

    const playbackId = extractPublicPlaybackId(asset.playback_ids)
    if (!playbackId) {
      return { outcome: 'processing' }
    }

    const { error } = await service
      .from('listing_videos')
      .update({
        mux_asset_id: assetId,
        mux_playback_id: playbackId,
        duration_seconds: duration,
        status: 'ready',
        rejection_reason: null,
      })
      .eq('id', listingVideoId)

    if (error) {
      return { outcome: 'error', reason: error.message }
    }

    return { outcome: 'ready', playbackId }
  }

  if (assetStatus === 'errored') {
    const reason = 'Mux reported an error processing this video.'
    await service
      .from('listing_videos')
      .update({
        mux_asset_id: assetId,
        status: 'error',
        rejection_reason: reason,
        gallery_position: null,
      })
      .eq('id', listingVideoId)

    return { outcome: 'error', reason }
  }

  if (assetStatus === 'preparing' || assetStatus === 'processing') {
    await service
      .from('listing_videos')
      .update({
        mux_asset_id: assetId,
        status: 'processing',
      })
      .eq('id', listingVideoId)

    return { outcome: 'processing' }
  }

  return { outcome: 'processing' }
}
