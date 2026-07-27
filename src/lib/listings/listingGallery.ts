import type { ListingVideoSlot } from '@/lib/listings/listingVideoUploadClient'
import { isGalleryVideoStatus } from '@/lib/listings/galleryPosition'

export interface PhotoGalleryItem {
  kind: 'photo'
  id: string
  url: string
  gallery_position: number
}

export interface VideoGalleryItem {
  kind: 'video'
  slot: ListingVideoSlot
  gallery_position: number
}

export type GalleryItem = PhotoGalleryItem | VideoGalleryItem

export function galleryItemKey(item: GalleryItem): string {
  const id = item.kind === 'photo' ? item.id : item.slot.id
  return `${item.kind}:${id}`
}

export function parseGalleryItemKey(key: string): { kind: 'photo' | 'video'; id: string } | null {
  const [kind, ...rest] = key.split(':')
  if ((kind !== 'photo' && kind !== 'video') || rest.length === 0) return null
  return { kind, id: rest.join(':') }
}

export interface PhotoWithGallery {
  id: string
  url: string
  gallery_position?: number | null
}

export function buildGalleryItems(
  photos: PhotoWithGallery[],
  videos: ListingVideoSlot[],
): GalleryItem[] {
  const galleryVideos = videos.filter((video) => isGalleryVideoStatus(video.status))

  const items: GalleryItem[] = [
    ...photos.map((photo, index) => ({
      kind: 'photo' as const,
      id: photo.id,
      url: photo.url,
      gallery_position: photo.gallery_position ?? index,
    })),
    ...galleryVideos.map((slot, index) => ({
      kind: 'video' as const,
      slot,
      gallery_position: slot.gallery_position ?? photos.length + index,
    })),
  ]

  return items.sort((a, b) => a.gallery_position - b.gallery_position)
}

export function applyGalleryPositions(items: GalleryItem[]): GalleryItem[] {
  return items.map((item, index) => ({
    ...item,
    gallery_position: index,
    ...(item.kind === 'video'
      ? { slot: { ...item.slot, gallery_position: index } }
      : {}),
  }))
}

export function splitGalleryItems(items: GalleryItem[]): {
  photos: PhotoWithGallery[]
  videos: ListingVideoSlot[]
} {
  const photos: PhotoWithGallery[] = []
  const videos: ListingVideoSlot[] = []

  for (const item of items) {
    if (item.kind === 'photo') {
      photos.push({
        id: item.id,
        url: item.url,
        gallery_position: item.gallery_position,
      })
    } else {
      videos.push({
        ...item.slot,
        gallery_position: item.gallery_position,
      })
    }
  }

  return { photos, videos }
}

export type GalleryOrderEntry = { type: 'photo' | 'video'; id: string }

export function galleryItemsToOrder(items: GalleryItem[]): GalleryOrderEntry[] {
  return items.map((item) => ({
    type: item.kind,
    id: item.kind === 'photo' ? item.id : item.slot.id,
  }))
}

export async function saveGalleryOrder(
  listingId: string,
  items: GalleryItem[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await fetch(`/api/listings/${listingId}/gallery-order`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gallery_order: galleryItemsToOrder(items) }),
  })

  const data = (await res.json()) as { error?: string }
  if (!res.ok) {
    return { ok: false, error: data.error ?? 'Could not save media order' }
  }

  return { ok: true }
}
