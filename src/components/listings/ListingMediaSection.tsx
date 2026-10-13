'use client'

import { useRef, useState } from 'react'
import { MAX_LISTING_PHOTOS } from '@/lib/listings/listingPhotoUpload'
import { MAX_LISTING_VIDEOS } from '@/lib/listings/listingVideoUpload'
import {
  LISTING_PHOTO_ACCEPT,
} from '@/lib/listings/listingPhotoUpload'
import {
  LISTING_VIDEO_ACCEPT,
  rejectionDisplayMessage,
  type ListingVideoSlot,
} from '@/lib/listings/listingVideoUploadClient'
import { LISTING_MEDIA_DROP_PHOTO_RULE, LISTING_MEDIA_DROP_VIDEO_RULE } from '@/lib/listings/listingMediaCopy'
import { labelCls } from '@/components/listings/ListingTaxonomyFields'
import ListingMediaGallery from '@/components/listings/ListingMediaGallery'
import { LISTING_MEDIA_CAPTION } from '@/hooks/useListingGallery'
import type { GalleryItem } from '@/lib/listings/listingGallery'
import type { PhotoState } from '@/hooks/useListingGallery'

interface Props {
  listingId: string | null
  photos: PhotoState[]
  galleryItems: GalleryItem[]
  uploadingPhoto: boolean
  canAddPhoto: boolean
  canAddVideo: boolean
  activeVideoCount: number
  rejectedVideos: ListingVideoSlot[]
  videosLoading?: boolean
  layout?: 'horizontal' | 'grid'
  onReorder: (items: GalleryItem[]) => void | Promise<void>
  onFileSelect: (files: FileList) => void
  onAddVideo: (file: File) => Promise<string | null>
  onRemovePhoto: (id: string) => void
  onRemoveVideo: (videoId: string) => Promise<string | null>
  onError?: (message: string) => void
  required?: boolean
}

export default function ListingMediaSection({
  listingId,
  photos,
  galleryItems,
  uploadingPhoto,
  canAddPhoto,
  canAddVideo,
  activeVideoCount,
  rejectedVideos,
  videosLoading = false,
  layout = 'grid',
  onReorder,
  onFileSelect,
  onAddVideo,
  onRemovePhoto,
  onRemoveVideo,
  onError,
  required = false,
}: Props) {
  const mediaInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const addingVideoRef = useRef(false)
  const [addingVideo, setAddingVideo] = useState(false)

  async function handleAddVideo(file: File) {
    if (!listingId || addingVideoRef.current) {
      return
    }
    addingVideoRef.current = true
    setAddingVideo(true)
    onError?.('')
    try {
      const error = await onAddVideo(file)
      if (error) onError?.(error)
    } finally {
      addingVideoRef.current = false
      setAddingVideo(false)
    }
  }

  function isVideoFile(file: File): boolean {
    if (file.type.startsWith('video/')) return true
    return /\.(mp4|mov|webm|m4v)$/i.test(file.name)
  }

  async function handleMediaDrop(files: FileList) {
    const photoFiles: File[] = []
    const videoFiles: File[] = []
    for (const file of Array.from(files)) {
      if (isVideoFile(file)) {
        videoFiles.push(file)
      } else {
        photoFiles.push(file)
      }
    }
    for (const file of videoFiles) {
      if (canAddVideo) await handleAddVideo(file)
    }

    if (photoFiles.length > 0) {
      const transfer = new DataTransfer()
      photoFiles.forEach(file => transfer.items.add(file))
      onFileSelect(transfer.files)
    }
  }

  function handleMediaInputChange(files: FileList | null) {
    if (!files?.length) return
    void handleMediaDrop(files)
  }

  return (
    <div>
      <label className={labelCls}>
        Media{required && <span className="ml-0.5 text-[#CC0000]">*</span>}
      </label>
      <p className="mb-3 text-sm text-ink-2 leading-relaxed">{LISTING_MEDIA_CAPTION}</p>

      {(canAddPhoto || canAddVideo) && (
        <div
          className="border-2 border-dashed border-[#D4D5D7] rounded-[14px] flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-orange hover:bg-orange/[0.02] transition-colors"
          style={{ minHeight: '140px', padding: '16px' }}
          onClick={() => mediaInputRef.current?.click()}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault()
            if (event.dataTransfer.files.length) handleMediaDrop(event.dataTransfer.files)
          }}
        >
          <input
            ref={mediaInputRef}
            type="file"
            accept={`${LISTING_PHOTO_ACCEPT},${LISTING_VIDEO_ACCEPT}`}
            multiple
            className="hidden"
            onChange={(event) => {
              handleMediaInputChange(event.target.files)
              event.target.value = ''
            }}
          />
          <input
            ref={videoInputRef}
            type="file"
            accept={LISTING_VIDEO_ACCEPT}
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.target.value = ''
              if (file) void handleAddVideo(file)
            }}
          />

          {uploadingPhoto || videosLoading ? (
            <div className="flex items-center gap-2 text-ink-3">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden>
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm font-sans">Uploading…</span>
            </div>
          ) : (
            <>
              <svg className="w-7 h-7 text-ink-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm font-sans text-ink-2 text-center">
                <span className="font-semibold text-orange">Click to add media</span> or drag and drop
              </p>
              <div className="text-xs text-ink-3 text-center leading-relaxed space-y-0.5">
                <p>{LISTING_MEDIA_DROP_PHOTO_RULE}</p>
                <p>{LISTING_MEDIA_DROP_VIDEO_RULE}</p>
              </div>
            </>
          )}
        </div>
      )}

      {galleryItems.length > 0 && (
        <div className="mt-3">
          <ListingMediaGallery
            items={galleryItems}
            onReorder={onReorder}
            onRemovePhoto={onRemovePhoto}
            onRemoveVideo={(videoId) => { void onRemoveVideo(videoId) }}
            layout={layout}
          />
          <p className="text-xs text-ink-3 mt-2">
            Drag to reorder — the first photo is the cover image.
          </p>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-mono text-ink-3">
          {photos.length} / {MAX_LISTING_PHOTOS} photos · {activeVideoCount} / {MAX_LISTING_VIDEOS} videos
        </p>
        {canAddVideo && (
          <button
            type="button"
            disabled={!listingId || addingVideo}
            onClick={() => videoInputRef.current?.click()}
            className="text-xs font-bold text-orange hover:text-orange-lt disabled:opacity-40"
          >
            {addingVideo ? 'Starting video upload…' : '+ Add video'}
          </button>
        )}
      </div>

      {rejectedVideos.length > 0 && (
        <div className="mt-4 space-y-2">
          {rejectedVideos.map((video) => (
            <div
              key={video.id}
              className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2.5"
            >
              <p className="text-xs leading-relaxed text-red-600">
                {rejectionDisplayMessage(video.rejection_reason)}
              </p>
              <button
                type="button"
                onClick={() => { void onRemoveVideo(video.id) }}
                className="mt-1 text-xs font-bold text-ink-2 hover:text-ink"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
