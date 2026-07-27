import type { SupabaseClient } from '@supabase/supabase-js'
import type { UnwrapWebhookEvent } from '@mux/mux-node/resources/webhooks/webhooks'
import {
  MAX_VIDEO_DURATION_SECONDS,
  VIDEO_TOO_LONG_REJECTION_REASON,
} from '@/lib/listings/listingVideoUpload'
import type { ListingVideo, ListingVideoStatus } from '@/lib/types/database'
import { deleteMuxAsset } from '@/lib/mux/deleteAsset'
import { syncListingVideoFromMuxAsset } from '@/lib/mux/syncListingVideoAsset'

type ListingVideoRow = Pick<
  ListingVideo,
  'id' | 'status' | 'mux_asset_id' | 'mux_playback_id'
>

async function loadListingVideoRow(
  service: SupabaseClient,
  listingVideoId: string | null | undefined,
  assetId?: string | null,
): Promise<ListingVideoRow | null> {
  if (listingVideoId) {
    const { data } = await service
      .from('listing_videos')
      .select('id, status, mux_asset_id, mux_playback_id')
      .eq('id', listingVideoId)
      .maybeSingle()

    if (data) return data as ListingVideoRow
  }

  if (assetId) {
    const { data } = await service
      .from('listing_videos')
      .select('id, status, mux_asset_id, mux_playback_id')
      .eq('mux_asset_id', assetId)
      .maybeSingle()

    if (data) return data as ListingVideoRow
  }

  return null
}

function isTerminalStatus(status: ListingVideoStatus): boolean {
  return status === 'ready' || status === 'rejected_too_long' || status === 'error'
}

async function rejectOverLengthAsset(
  service: SupabaseClient,
  rowId: string,
  assetId: string,
  duration: number,
): Promise<void> {
  try {
    await deleteMuxAsset(assetId)
  } catch (err) {
    console.error('[mux/webhook] failed to delete over-length asset', assetId, err)
  }

  const { error } = await service
    .from('listing_videos')
    .update({
      mux_asset_id: assetId,
      status: 'rejected_too_long',
      rejection_reason: VIDEO_TOO_LONG_REJECTION_REASON,
      duration_seconds: duration,
      gallery_position: null,
    })
    .eq('id', rowId)

  if (error) {
    throw new Error(`Failed to reject over-length listing video: ${error.message}`)
  }
}

async function markAssetProcessing(
  service: SupabaseClient,
  listingVideoId: string,
  assetId: string,
): Promise<void> {
  const row = await loadListingVideoRow(service, listingVideoId)
  if (!row) {
    console.warn('[mux/webhook] listing_video not found for passthrough', listingVideoId)
    return
  }

  if (row.mux_asset_id === assetId && row.status === 'processing') return
  if (isTerminalStatus(row.status)) return

  const { error } = await service
    .from('listing_videos')
    .update({
      mux_asset_id: assetId,
      status: 'processing',
    })
    .eq('id', row.id)

  if (error) {
    throw new Error(`Failed to mark listing video processing: ${error.message}`)
  }
}

async function handleAssetReady(
  service: SupabaseClient,
  event: Extract<UnwrapWebhookEvent, { type: 'video.asset.ready' }>,
): Promise<void> {
  const { data } = event
  const assetId = data.id
  const listingVideoId = data.passthrough ?? null

  const row = await loadListingVideoRow(service, listingVideoId, assetId)
  if (!row) {
    console.warn('[mux/webhook] listing_video not found for asset.ready', {
      listingVideoId,
      assetId,
    })
    return
  }

  if (row.status === 'ready' && row.mux_playback_id) return
  if (row.status === 'rejected_too_long') return

  const playbackIdFromEvent = data.playback_ids?.[0]?.id
  if (playbackIdFromEvent) {
    const duration = data.duration ?? 0

    if (duration > MAX_VIDEO_DURATION_SECONDS) {
      await rejectOverLengthAsset(service, row.id, assetId, duration)
      return
    }

    const { error } = await service
      .from('listing_videos')
      .update({
        mux_asset_id: assetId,
        mux_playback_id: playbackIdFromEvent,
        duration_seconds: duration,
        status: 'ready',
        rejection_reason: null,
      })
      .eq('id', row.id)

    if (error) {
      throw new Error(`Failed to mark listing video ready: ${error.message}`)
    }
    return
  }

  // Webhook payload sometimes omits playback_ids — fetch from Mux API instead of leaving stuck on processing.
  const sync = await syncListingVideoFromMuxAsset(service, row.id, assetId)
  if (sync.outcome === 'error') {
    throw new Error(`Failed to sync listing video from Mux: ${sync.reason}`)
  }
}

async function handleAssetErrored(
  service: SupabaseClient,
  event: Extract<UnwrapWebhookEvent, { type: 'video.asset.errored' }>,
): Promise<void> {
  const { data } = event
  const assetId = data.id
  const listingVideoId = data.passthrough ?? null

  const row = await loadListingVideoRow(service, listingVideoId, assetId)
  if (!row) {
    console.warn('[mux/webhook] listing_video not found for asset.errored', {
      listingVideoId,
      assetId,
    })
    return
  }

  if (row.status === 'error') return
  if (row.status === 'rejected_too_long') return

  const messages = data.errors?.messages?.filter(Boolean) ?? []
  const rejectionReason =
    messages.length > 0
      ? messages.join('; ')
      : data.errors?.type ?? 'Mux reported an error processing this video.'

  const { error } = await service
    .from('listing_videos')
    .update({
      mux_asset_id: assetId,
      status: 'error',
      rejection_reason: rejectionReason,
      gallery_position: null,
    })
    .eq('id', row.id)

  if (error) {
    throw new Error(`Failed to mark listing video errored: ${error.message}`)
  }
}

export async function handleMuxListingVideoWebhook(
  service: SupabaseClient,
  event: UnwrapWebhookEvent,
): Promise<void> {
  switch (event.type) {
    case 'video.upload.asset_created': {
      const assetId = event.data.asset_id
      const uploadData = event.data as { new_asset_settings?: { passthrough?: string } }
      const listingVideoId = uploadData.new_asset_settings?.passthrough
      if (!assetId || !listingVideoId) break
      await markAssetProcessing(service, listingVideoId, assetId)
      break
    }

    case 'video.asset.created': {
      const assetId = event.data.id
      const listingVideoId = event.data.passthrough
      if (!assetId || !listingVideoId) break
      await markAssetProcessing(service, listingVideoId, assetId)
      break
    }

    case 'video.asset.ready':
      await handleAssetReady(service, event)
      break

    case 'video.asset.errored':
      await handleAssetErrored(service, event)
      break

    default:
      break
  }
}
