'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MAX_LISTING_VIDEOS } from '@/lib/listings/listingVideoUpload'
import {
  countsTowardVideoCap,
  getVideoDurationSeconds,
  linkListingVideoUpload,
  requestListingVideoUploadUrl,
  uploadFileToMuxDirectUrl,
  validateVideoDuration,
  type ListingVideoSlot,
} from '@/lib/listings/listingVideoUploadClient'
import type { ListingVideoStatus } from '@/lib/types/database'

const POLL_INTERVAL_MS = 3000

function rowToSlot(row: {
  id: string
  position: number
  gallery_position: number | null
  status: ListingVideoStatus
  mux_playback_id: string | null
  duration_seconds: number | null
  rejection_reason: string | null
}): ListingVideoSlot {
  return {
    id: row.id,
    position: row.position,
    gallery_position: row.gallery_position,
    status: row.status,
    mux_playback_id: row.mux_playback_id,
    duration_seconds: row.duration_seconds,
    rejection_reason: row.rejection_reason,
  }
}

function mergeLocalState(
  remote: ListingVideoSlot[],
  localById: Map<string, ListingVideoSlot>,
): ListingVideoSlot[] {
  return remote.map((row) => {
    const local = localById.get(row.id)
    if (!local) return row

    const keepLocalPreview =
      local.localPreviewUrl &&
      (row.status === 'uploading' || row.status === 'processing')

    return {
      ...row,
      fileName: local.fileName ?? row.fileName,
      uploadProgress: row.status === 'uploading' ? local.uploadProgress : null,
      localPreviewUrl: keepLocalPreview ? local.localPreviewUrl : undefined,
      uploadComplete:
        row.status === 'uploading'
          ? local.uploadComplete
          : undefined,
    }
  })
}

export function useListingVideos(listingId: string | null) {
  const [videos, setVideos] = useState<ListingVideoSlot[]>([])
  const [loading, setLoading] = useState(false)
  const localStateRef = useRef<Map<string, ListingVideoSlot>>(new Map())

  const syncVideos = useCallback((rows: ListingVideoSlot[]) => {
    setVideos(mergeLocalState(rows, localStateRef.current))
  }, [])

  const fetchVideos = useCallback(async () => {
    if (!listingId) return

    const supabase = createClient()
    const { data, error } = await supabase
      .from('listing_videos')
      .select('id, position, gallery_position, status, mux_playback_id, duration_seconds, rejection_reason')
      .eq('listing_id', listingId)
      .order('position', { ascending: true })

    if (error) {
      console.error('[useListingVideos] fetch failed', error)
      return
    }

    syncVideos((data ?? []).map(rowToSlot))
  }, [listingId, syncVideos])

  useEffect(() => {
    if (!listingId) {
      setVideos([])
      return
    }

    setLoading(true)
    void fetchVideos().finally(() => setLoading(false))
  }, [listingId, fetchVideos])

  useEffect(() => {
    if (!listingId) return

    const supabase = createClient()
    const channel = supabase
      .channel(`listing-videos-${listingId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'listing_videos',
          filter: `listing_id=eq.${listingId}`,
        },
        () => {
          void fetchVideos()
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [listingId, fetchVideos])

  useEffect(() => {
    const needsPoll = videos.some(
      (video) => video.status === 'uploading' || video.status === 'processing',
    )
    if (!listingId || !needsPoll) return

    let syncEvery = 0

    const interval = window.setInterval(() => {
      void fetchVideos()

      // Fallback when Mux webhooks don't flip rows to ready (e.g. missing video.asset.ready).
      syncEvery += 1
      if (syncEvery >= 3) {
        syncEvery = 0
        void fetch(`/api/listings/${listingId}/videos/sync`, { method: 'POST' })
          .then(() => fetchVideos())
          .catch(() => {})
      }
    }, POLL_INTERVAL_MS)

    return () => window.clearInterval(interval)
  }, [listingId, videos, fetchVideos])

  const activeVideoCount = videos.filter((video) => countsTowardVideoCap(video.status)).length
  const canAddVideo = activeVideoCount < MAX_LISTING_VIDEOS

  const addVideo = useCallback(
    async (file: File): Promise<string | null> => {
      if (!listingId) return 'Listing is not ready yet.'
      if (!canAddVideo) return `Maximum of ${MAX_LISTING_VIDEOS} videos per listing`

      let duration: number
      try {
        duration = await getVideoDurationSeconds(file)
      } catch {
        return 'Could not read this video file. Try a different format.'
      }

      const durationError = validateVideoDuration(duration)
      if (durationError) return durationError

      const uploadUrlResult = await requestListingVideoUploadUrl(listingId)
      if (!uploadUrlResult.ok) return uploadUrlResult.error

      const previewUrl = URL.createObjectURL(file)
      const slot: ListingVideoSlot = {
        id: uploadUrlResult.videoId,
        position: uploadUrlResult.position,
        gallery_position: uploadUrlResult.galleryPosition,
        status: 'uploading',
        mux_playback_id: null,
        duration_seconds: null,
        rejection_reason: null,
        fileName: file.name,
        uploadProgress: 0,
        localPreviewUrl: previewUrl,
        uploadComplete: false,
      }

      localStateRef.current.set(slot.id, slot)
      setVideos((prev) => {
        const without = prev.filter((video) => video.id !== slot.id)
        return [...without, slot].sort((a, b) => a.position - b.position)
      })

      try {
        await uploadFileToMuxDirectUrl(
          uploadUrlResult.uploadUrl,
          file,
          (percent) => {
            const updated: ListingVideoSlot = {
              ...slot,
              uploadProgress: percent,
            }
            localStateRef.current.set(slot.id, updated)
            setVideos((prev) =>
              prev.map((video) => (video.id === slot.id ? updated : video)),
            )
          },
        )

        const completed: ListingVideoSlot = {
          ...slot,
          uploadProgress: 100,
          uploadComplete: true,
        }
        localStateRef.current.set(slot.id, completed)
        setVideos((prev) =>
          prev.map((video) => (video.id === slot.id ? completed : video)),
        )

        if (uploadUrlResult.muxUploadId) {
          await linkListingVideoUpload(listingId, slot.id, uploadUrlResult.muxUploadId)
          void fetchVideos()
        }
      } catch (err) {
        localStateRef.current.delete(slot.id)
        URL.revokeObjectURL(previewUrl)
        setVideos((prev) => prev.filter((video) => video.id !== slot.id))
        void fetch(
          `/api/listings/${listingId}/videos/${uploadUrlResult.videoId}`,
          { method: 'DELETE' },
        ).catch(() => {})

        return err instanceof Error ? err.message : 'Video upload failed'
      }

      return null
    },
    [listingId, canAddVideo, fetchVideos],
  )

  const removeVideo = useCallback(
    async (videoId: string): Promise<string | null> => {
      if (!listingId) return 'Listing is not ready yet.'

      const removed = videos.find((video) => video.id === videoId)
      if (!removed) return null

      setVideos((prev) => prev.filter((video) => video.id !== videoId))
      localStateRef.current.delete(videoId)
      if (removed.localPreviewUrl) {
        URL.revokeObjectURL(removed.localPreviewUrl)
      }

      try {
        const res = await fetch(
          `/api/listings/${listingId}/videos/${videoId}`,
          { method: 'DELETE' },
        )
        if (!res.ok) {
          const data = (await res.json()) as { error?: string }
          throw new Error(data.error ?? 'Could not remove video')
        }
        return null
      } catch (err) {
        setVideos((prev) => [...prev, removed].sort((a, b) => a.position - b.position))
        localStateRef.current.set(videoId, removed)
        return err instanceof Error ? err.message : 'Could not remove video'
      }
    },
    [listingId, videos],
  )

  const rejectedVideos = videos.filter(
    (video) => video.status === 'rejected_too_long' || video.status === 'error',
  )

  const mergeVideosFromGallery = useCallback((nextVideos: ListingVideoSlot[]) => {
    const galleryIds = new Set(nextVideos.map((video) => video.id))
    const rejected = videos.filter((video) => !galleryIds.has(video.id))
    syncVideos([...nextVideos, ...rejected])
  }, [videos, syncVideos])

  return {
    videos,
    rejectedVideos,
    loading,
    canAddVideo,
    activeVideoCount,
    addVideo,
    removeVideo,
    mergeVideosFromGallery,
  }
}
