export const MAX_LISTING_PHOTOS = 20
/** Kept under Vercel's ~4.5 MB API body limit. */
export const MAX_LISTING_PHOTO_BYTES = 4 * 1024 * 1024

export const ALLOWED_LISTING_PHOTO_TYPES = ['image/png', 'image/jpeg', 'image/jpg'] as const

export const LISTING_PHOTO_ACCEPT = 'image/png, image/jpeg'

export const LISTING_PHOTO_UPLOAD_HINT = `PNG or JPG · max 4 MB per photo · up to ${MAX_LISTING_PHOTOS} photos`

export function formatPhotoSizeMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function validateListingPhotoFile(file: File): string | null {
  if (!ALLOWED_LISTING_PHOTO_TYPES.includes(file.type as (typeof ALLOWED_LISTING_PHOTO_TYPES)[number])) {
    return `${file.name}: only PNG and JPG files are allowed`
  }
  if (file.size > MAX_LISTING_PHOTO_BYTES) {
    return `${file.name} is ${formatPhotoSizeMb(file.size)} — max 4 MB per photo`
  }
  return null
}

export interface UploadedListingPhoto {
  id: string
  url: string
  gallery_position?: number | null
}

export async function uploadListingPhoto(
  listingId: string,
  file: File,
): Promise<{ ok: true; image: UploadedListingPhoto } | { ok: false; error: string }> {
  const validationError = validateListingPhotoFile(file)
  if (validationError) {
    return { ok: false, error: validationError }
  }

  const fd = new FormData()
  fd.append('file', file)

  try {
    const res = await fetch(`/api/listings/${listingId}/images`, { method: 'POST', body: fd })
    let data: { image?: UploadedListingPhoto; error?: string } = {}
    try {
      data = await res.json() as { image?: UploadedListingPhoto; error?: string }
    } catch {
      if (res.status === 413) {
        return { ok: false, error: `${file.name} is too large — max 4 MB per photo` }
      }
    }

    if (!res.ok || !data.image) {
      return {
        ok: false,
        error: data.error ?? `${file.name}: upload failed (${res.status})`,
      }
    }

    return { ok: true, image: data.image }
  } catch {
    return { ok: false, error: `${file.name}: network error — please try again` }
  }
}

export async function uploadListingPhotos(
  listingId: string,
  files: File[],
  maxRemaining: number,
): Promise<{
  uploaded: UploadedListingPhoto[]
  errors: string[]
}> {
  const toUpload = files.slice(0, maxRemaining)
  const uploaded: UploadedListingPhoto[] = []
  const errors: string[] = []

  for (const file of toUpload) {
    const result = await uploadListingPhoto(listingId, file)
    if (result.ok) {
      uploaded.push(result.image)
    } else {
      errors.push(result.error)
    }
  }

  return { uploaded, errors }
}
