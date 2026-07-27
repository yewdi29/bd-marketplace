import type { ListingImage, ListingVideo } from '@/lib/types/database'

export interface PublicGalleryPhotoItem {
  kind: 'photo'
  id: string
  url: string
  alt_text: string | null
  gallery_position: number
}

export interface PublicGalleryVideoItem {
  kind: 'video'
  id: string
  mux_playback_id: string
  gallery_position: number
  duration_seconds: number | null
}

export type PublicGalleryItem = PublicGalleryPhotoItem | PublicGalleryVideoItem

export function publicGalleryItemKey(item: PublicGalleryItem): string {
  return `${item.kind}:${item.id}`
}

/** Merge listing photos and public-visible videos into gallery_position order. */
export function buildPublicGalleryItems(
  images: ListingImage[],
  videos: ListingVideo[],
): PublicGalleryItem[] {
  const items: PublicGalleryItem[] = [
    ...images.map((img, index) => ({
      kind: 'photo' as const,
      id: img.id,
      url: img.url,
      alt_text: img.alt_text,
      gallery_position: img.gallery_position ?? index,
    })),
    ...videos
      .filter((video): video is ListingVideo & { mux_playback_id: string } =>
        Boolean(video.mux_playback_id),
      )
      .map((video, index) => ({
        kind: 'video' as const,
        id: video.id,
        mux_playback_id: video.mux_playback_id,
        gallery_position: video.gallery_position ?? images.length + index,
        duration_seconds: video.duration_seconds,
      })),
  ]

  return items.sort((a, b) => a.gallery_position - b.gallery_position)
}

export function publicGalleryHasVideo(items: PublicGalleryItem[]): boolean {
  return items.some(item => item.kind === 'video')
}
