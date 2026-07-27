'use client'

import { useCallback, useMemo } from 'react'
import {
  applyGalleryPositions,
  buildGalleryItems,
  saveGalleryOrder,
  splitGalleryItems,
  type GalleryItem,
  type PhotoWithGallery,
} from '@/lib/listings/listingGallery'
import type { ListingVideoSlot } from '@/lib/listings/listingVideoUploadClient'

export interface PhotoState extends PhotoWithGallery {}

interface UseListingGalleryArgs {
  listingId: string | null
  photos: PhotoState[]
  setPhotos: React.Dispatch<React.SetStateAction<PhotoState[]>>
  videos: ListingVideoSlot[]
  mergeVideosFromGallery: (videos: ListingVideoSlot[]) => void
}

export function useListingGallery({
  listingId,
  photos,
  setPhotos,
  videos,
  mergeVideosFromGallery,
}: UseListingGalleryArgs) {
  const galleryItems = useMemo(
    () => buildGalleryItems(photos, videos),
    [photos, videos],
  )

  const handleReorder = useCallback(
    async (nextItems: GalleryItem[]) => {
      const positioned = applyGalleryPositions(nextItems)
      const { photos: nextPhotos, videos: nextVideos } = splitGalleryItems(positioned)

      setPhotos(nextPhotos)
      mergeVideosFromGallery(nextVideos)

      if (!listingId || positioned.length === 0) return null

      const result = await saveGalleryOrder(listingId, positioned)
      if (!result.ok) return result.error
      return null
    },
    [listingId, mergeVideosFromGallery, setPhotos],
  )

  return {
    galleryItems,
    handleReorder,
  }
}

export const LISTING_MEDIA_CAPTION =
  'Media — Upload up to 20 photos (each under 4MB) and 3 videos (each under 3 minutes).'
