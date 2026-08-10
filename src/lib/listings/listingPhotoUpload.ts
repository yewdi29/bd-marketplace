/**
 * Listing photo upload — client prepares (HEIC→JPEG + compress) before POSTing
 * to /api/listings/[id]/images. Feedback uploads reuse the strict PNG/JPG helpers below
 * and do not run this prepare path.
 */

export const MAX_LISTING_PHOTOS = 20

/** Post-compression / API body safety ceiling (under Vercel ~4.5 MB). */
export const MAX_LISTING_PHOTO_BYTES = 4 * 1024 * 1024

/** Reject absurd originals before decode (not the primary UX rule). */
const MAX_LISTING_PHOTO_INPUT_BYTES = 40 * 1024 * 1024

const MAX_EDGE_PX = 2400
const JPEG_QUALITY = 0.8
/** Target under the 4 MB API ceiling with headroom for multipart overhead. */
const COMPRESS_MAX_SIZE_MB = 3.5

/** Types accepted from the file picker (converted/compressed before upload). */
export const LISTING_PHOTO_INPUT_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/heic',
  'image/heif',
] as const

export const LISTING_PHOTO_ACCEPT =
  'image/png,image/jpeg,image/jpg,image/heic,image/heif,.heic,.heif'

/** Types allowed on the wire to the listing images API after client prepare. */
export const ALLOWED_LISTING_PHOTO_TYPES = ['image/png', 'image/jpeg', 'image/jpg'] as const

export const LISTING_PHOTO_UPLOAD_HINT = `PNG, JPG, or HEIC · up to ${MAX_LISTING_PHOTOS} photos`

export function formatPhotoSizeMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function extensionOf(name: string): string {
  const part = name.split('.').pop()?.toLowerCase() ?? ''
  return part.replace(/[^a-z0-9]/g, '')
}

function isHeicInput(file: File): boolean {
  const type = (file.type || '').toLowerCase()
  if (type === 'image/heic' || type === 'image/heif') return true
  const ext = extensionOf(file.name)
  return ext === 'heic' || ext === 'heif'
}

function isAllowedListingPhotoInput(file: File): boolean {
  if (isHeicInput(file)) return true
  const type = (file.type || '').toLowerCase()
  if (
    LISTING_PHOTO_INPUT_MIME_TYPES.includes(
      type as (typeof LISTING_PHOTO_INPUT_MIME_TYPES)[number],
    )
  ) {
    return true
  }
  const ext = extensionOf(file.name)
  return ext === 'png' || ext === 'jpg' || ext === 'jpeg'
}

/**
 * Strict PNG/JPG + 4 MB check for raw uploads that skip client prepare
 * (e.g. feedback screenshots).
 */
export function validateListingPhotoFile(file: File): string | null {
  if (!ALLOWED_LISTING_PHOTO_TYPES.includes(file.type as (typeof ALLOWED_LISTING_PHOTO_TYPES)[number])) {
    return `${file.name}: only PNG and JPG files are allowed`
  }
  if (file.size > MAX_LISTING_PHOTO_BYTES) {
    return `${file.name} is ${formatPhotoSizeMb(file.size)} — max 4 MB per photo`
  }
  return null
}

/** Validate a seller-selected file before HEIC convert + compression. */
export function validateListingPhotoInput(file: File): string | null {
  if (!isAllowedListingPhotoInput(file)) {
    return `${file.name}: use a PNG, JPG, or HEIC photo`
  }
  if (file.size > MAX_LISTING_PHOTO_INPUT_BYTES) {
    return `${file.name} is too large to process — try a smaller photo`
  }
  if (file.size === 0) {
    return `${file.name}: file is empty`
  }
  return null
}

function jpegFileName(originalName: string): string {
  const base = originalName.replace(/\.[^.]+$/, '') || 'photo'
  return `${base}.jpg`
}

async function convertHeicToJpegFile(file: File): Promise<File> {
  const heic2any = (await import('heic2any')).default
  const result = await heic2any({
    blob: file,
    toType: 'image/jpeg',
    quality: JPEG_QUALITY,
  })
  const blob = Array.isArray(result) ? result[0] : result
  if (!blob) {
    throw new Error('HEIC conversion produced no image')
  }
  return new File([blob], jpegFileName(file.name), {
    type: 'image/jpeg',
    lastModified: Date.now(),
  })
}

/**
 * Invisible client prepare: HEIC→JPEG (when needed), then resize/compress to JPEG.
 * Output is always suitable for POST /api/listings/[id]/images under the 4 MB cap.
 */
export async function prepareListingPhotoForUpload(file: File): Promise<File> {
  const inputError = validateListingPhotoInput(file)
  if (inputError) {
    throw new Error(inputError)
  }

  let working: File = file

  if (isHeicInput(file)) {
    try {
      working = await convertHeicToJpegFile(file)
    } catch (err) {
      const detail = err instanceof Error ? err.message : 'unknown error'
      throw new Error(
        `${file.name}: could not convert this HEIC photo (${detail}). Try exporting it as JPG and upload again.`,
      )
    }
  }

  try {
    const imageCompression = (await import('browser-image-compression')).default
    const compressed = await imageCompression(working, {
      maxSizeMB: COMPRESS_MAX_SIZE_MB,
      maxWidthOrHeight: MAX_EDGE_PX,
      initialQuality: JPEG_QUALITY,
      fileType: 'image/jpeg',
      useWebWorker: true,
      // Do not upscale — library only shrinks when larger than maxWidthOrHeight.
    })

    const out = new File([compressed], jpegFileName(file.name), {
      type: 'image/jpeg',
      lastModified: Date.now(),
    })

    if (out.size > MAX_LISTING_PHOTO_BYTES) {
      throw new Error(
        `${file.name}: still ${formatPhotoSizeMb(out.size)} after optimizing — max ${formatPhotoSizeMb(MAX_LISTING_PHOTO_BYTES)} for upload`,
      )
    }

    return out
  } catch (err) {
    if (err instanceof Error && err.message.includes(file.name)) {
      throw err
    }
    const detail = err instanceof Error ? err.message : 'unknown error'
    throw new Error(
      `${file.name}: could not optimize this photo (${detail}). Try a different image.`,
    )
  }
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
  let prepared: File
  try {
    prepared = await prepareListingPhotoForUpload(file)
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : `${file.name}: could not process photo`,
    }
  }

  // Safety net — prepare already enforces this; keeps API contract explicit.
  const uploadValidation = validateListingPhotoFile(prepared)
  if (uploadValidation) {
    return { ok: false, error: uploadValidation }
  }

  const fd = new FormData()
  fd.append('file', prepared)

  try {
    const res = await fetch(`/api/listings/${listingId}/images`, { method: 'POST', body: fd })
    let data: { image?: UploadedListingPhoto; error?: string } = {}
    try {
      data = (await res.json()) as { image?: UploadedListingPhoto; error?: string }
    } catch {
      if (res.status === 413) {
        return { ok: false, error: `${file.name} is too large after optimizing — please try another photo` }
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
