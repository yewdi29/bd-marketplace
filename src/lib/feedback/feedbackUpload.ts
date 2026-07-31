/**
 * Feedback screenshot upload — reuses the same PNG/JPG + 4 MB rules as listing photos.
 */
import {
  ALLOWED_LISTING_PHOTO_TYPES,
  LISTING_PHOTO_ACCEPT,
  MAX_LISTING_PHOTO_BYTES,
  formatPhotoSizeMb,
  validateListingPhotoFile,
} from '@/lib/listings/listingPhotoUpload'

export const FEEDBACK_IMAGE_ACCEPT = LISTING_PHOTO_ACCEPT
export const FEEDBACK_IMAGE_HINT = 'PNG or JPG · max 4 MB · optional for bug reports'
export const MAX_FEEDBACK_IMAGE_BYTES = MAX_LISTING_PHOTO_BYTES
export const ALLOWED_FEEDBACK_IMAGE_TYPES = ALLOWED_LISTING_PHOTO_TYPES

export { formatPhotoSizeMb, validateListingPhotoFile as validateFeedbackImageFile }

export async function uploadFeedbackImage(
  file: File,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const validationError = validateListingPhotoFile(file)
  if (validationError) {
    return { ok: false, error: validationError }
  }

  const fd = new FormData()
  fd.append('file', file)

  try {
    const res = await fetch('/api/feedback/upload', { method: 'POST', body: fd })
    let data: { url?: string; error?: string } = {}
    try {
      data = (await res.json()) as { url?: string; error?: string }
    } catch {
      if (res.status === 413) {
        return { ok: false, error: `${file.name} is too large — max 4 MB` }
      }
    }

    if (!res.ok || !data.url) {
      return { ok: false, error: data.error ?? `Upload failed (${res.status})` }
    }

    return { ok: true, url: data.url }
  } catch {
    return { ok: false, error: 'Network error — please try again' }
  }
}
