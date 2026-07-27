import {
  MAX_VIDEO_DURATION_SECONDS,
  VIDEO_TOO_LONG_REJECTION_REASON,
} from '@/lib/listings/listingVideoUpload'
import type { ListingVideoStatus } from '@/lib/types/database'

export const LISTING_VIDEO_ACCEPT = 'video/mp4,video/quicktime,video/webm,video/x-m4v,.mp4,.mov,.webm'

export const LISTING_VIDEO_UPLOAD_HINT =
  'MP4, MOV, or WebM · max 3 minutes · up to 3 videos'

export const VIDEO_DURATION_REJECT_MESSAGE =
  'This video is longer than the 3-minute limit. Please trim it and try again.'

export interface ListingVideoSlot {
  id: string
  position: number
  gallery_position?: number | null
  status: ListingVideoStatus
  mux_playback_id: string | null
  duration_seconds: number | null
  rejection_reason: string | null
  fileName?: string
  uploadProgress?: number | null
  localPreviewUrl?: string
  /** PUT to Mux finished; row may still be `uploading` until webhook fires. */
  uploadComplete?: boolean
}

export function muxThumbnailUrl(playbackId: string, time = 0): string {
  return `https://image.mux.com/${playbackId}/thumbnail.jpg?time=${time}&width=480`
}

export function countsTowardVideoCap(status: ListingVideoStatus): boolean {
  return status !== 'rejected_too_long' && status !== 'error'
}

/** Reads duration from a local file before any network upload. */
export function getVideoDurationSeconds(file: File): Promise<number> {
  const objectUrl = URL.createObjectURL(file)

  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl)
      if (!Number.isFinite(video.duration)) {
        reject(new Error('Could not read video duration'))
        return
      }
      resolve(video.duration)
    }

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Could not read video file'))
    }

    video.src = objectUrl
  })
}

export function validateVideoDuration(durationSeconds: number): string | null {
  if (durationSeconds > MAX_VIDEO_DURATION_SECONDS) {
    return VIDEO_DURATION_REJECT_MESSAGE
  }
  return null
}

interface UploadUrlResponse {
  success?: boolean
  video?: { id: string; position: number; gallery_position?: number | null }
  uploadUrl?: string
  muxUploadId?: string
  error?: string
}

/** Serializes upload-url requests per listing across all callers/components. */
const uploadUrlTailByListing = new Map<string, Promise<unknown>>()

function withUploadUrlLock<T>(listingId: string, task: () => Promise<T>): Promise<T> {
  const previous = uploadUrlTailByListing.get(listingId) ?? Promise.resolve()
  const current = previous.catch(() => undefined).then(task)
  uploadUrlTailByListing.set(listingId, current)
  return current.finally(() => {
    if (uploadUrlTailByListing.get(listingId) === current) {
      uploadUrlTailByListing.delete(listingId)
    }
  })
}

async function fetchListingVideoUploadUrl(listingId: string): Promise<
  | { ok: true; videoId: string; position: number; galleryPosition: number; uploadUrl: string; muxUploadId: string }
  | { ok: false; error: string }
> {
  const res = await fetch(`/api/listings/${listingId}/videos/upload-url`, { method: 'POST' })
  const data = (await res.json()) as UploadUrlResponse

  if (!res.ok || !data.uploadUrl || !data.video?.id) {
    return { ok: false, error: data.error ?? 'Could not start video upload' }
  }

  return {
    ok: true,
    videoId: data.video.id,
    position: data.video.position,
    galleryPosition: data.video.gallery_position ?? 0,
    uploadUrl: data.uploadUrl,
    muxUploadId: data.muxUploadId ?? '',
  }
}

export async function requestListingVideoUploadUrl(
  listingId: string,
): Promise<
  | { ok: true; videoId: string; position: number; galleryPosition: number; uploadUrl: string; muxUploadId: string }
  | { ok: false; error: string }
> {
  return withUploadUrlLock(listingId, () => fetchListingVideoUploadUrl(listingId))
}

export async function linkListingVideoUpload(
  listingId: string,
  videoId: string,
  muxUploadId: string,
): Promise<{ ok: true; outcome: string } | { ok: false; error: string }> {
  const res = await fetch(`/api/listings/${listingId}/videos/${videoId}/link-upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ muxUploadId }),
  })
  const data = (await res.json()) as { success?: boolean; outcome?: string; error?: string }
  if (!res.ok || !data.success) {
    return { ok: false, error: data.error ?? 'Could not link video upload' }
  }
  return { ok: true, outcome: data.outcome ?? 'waiting' }
}

export function uploadFileToMuxDirectUrl(
  uploadUrl: string,
  file: File,
  onProgress: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', (event) => {
      if (!event.lengthComputable) return
      onProgress(Math.round((event.loaded / event.total) * 100))
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
        return
      }
      reject(new Error(`Upload failed (${xhr.status})`))
    })

    xhr.addEventListener('error', () => {
      reject(new Error('Network error during video upload'))
    })

    xhr.open('PUT', uploadUrl)
    xhr.setRequestHeader('Content-Type', file.type || 'video/mp4')
    xhr.send(file)
  })
}

export function rejectionDisplayMessage(reason: string | null): string {
  if (!reason) return 'This video could not be processed.'
  if (reason === VIDEO_TOO_LONG_REJECTION_REASON) {
    return VIDEO_DURATION_REJECT_MESSAGE
  }
  return reason
}
