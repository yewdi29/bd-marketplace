import type { SupabaseClient } from '@supabase/supabase-js'
import { getMuxClient } from '@/lib/mux/client'
import {
  syncListingVideoFromMuxAsset,
  type SyncListingVideoResult,
} from '@/lib/mux/syncListingVideoAsset'

export type LinkUploadResult =
  | SyncListingVideoResult
  | { outcome: 'waiting' }
  | { outcome: 'error'; reason: string }

/** After the browser PUT finishes, resolve the Mux upload → asset and update listing_videos. */
export async function linkListingVideoFromMuxUpload(
  service: SupabaseClient,
  listingVideoId: string,
  muxUploadId: string,
): Promise<LinkUploadResult> {
  const { data: row } = await service
    .from('listing_videos')
    .select('id, status, mux_asset_id, mux_playback_id')
    .eq('id', listingVideoId)
    .maybeSingle()

  if (!row) return { outcome: 'not_found' }
  if (row.status === 'ready' && row.mux_playback_id) {
    return { outcome: 'ready', playbackId: row.mux_playback_id }
  }

  let upload
  try {
    upload = await getMuxClient().video.uploads.retrieve(muxUploadId)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not read Mux upload'
    return { outcome: 'error', reason: message }
  }

  const assetId = upload.asset_id
  if (!assetId) {
    return { outcome: 'waiting' }
  }

  if (!row.mux_asset_id || row.mux_asset_id !== assetId) {
    const { error } = await service
      .from('listing_videos')
      .update({
        mux_asset_id: assetId,
        status: 'processing',
      })
      .eq('id', listingVideoId)

    if (error) {
      return { outcome: 'error', reason: error.message }
    }
  }

  return syncListingVideoFromMuxAsset(service, listingVideoId, assetId)
}

/** Recovery when webhooks never linked the row — find asset by passthrough (= listing_videos.id). */
export async function findMuxAssetIdByPassthrough(
  listingVideoId: string,
): Promise<string | null> {
  const mux = getMuxClient()
  let page = 1
  const limit = 100

  while (page <= 5) {
    const response = await mux.video.assets.list({ limit, page })
    const match = response.data?.find((asset) => asset.passthrough === listingVideoId)
    if (match?.id) return match.id
    if (!response.data?.length || response.data.length < limit) break
    page += 1
  }

  return null
}

export async function linkListingVideoByPassthrough(
  service: SupabaseClient,
  listingVideoId: string,
): Promise<LinkUploadResult> {
  const assetId = await findMuxAssetIdByPassthrough(listingVideoId)
  if (!assetId) return { outcome: 'waiting' }

  const { error } = await service
    .from('listing_videos')
    .update({
      mux_asset_id: assetId,
      status: 'processing',
    })
    .eq('id', listingVideoId)

  if (error) {
    return { outcome: 'error', reason: error.message }
  }

  return syncListingVideoFromMuxAsset(service, listingVideoId, assetId)
}
