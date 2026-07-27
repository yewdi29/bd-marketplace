'use client'

import { useEffect, useState } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import {
  galleryItemKey,
  type GalleryItem,
} from '@/lib/listings/listingGallery'
import {
  muxThumbnailUrl,
} from '@/lib/listings/listingVideoUploadClient'

interface ListingMediaGalleryProps {
  items: GalleryItem[]
  onReorder: (items: GalleryItem[]) => void | Promise<void>
  onRemovePhoto: (id: string) => void
  onRemoveVideo: (id: string) => void
  layout: 'horizontal' | 'grid'
}

function VideoIcon() {
  return (
    <svg className="w-8 h-8 text-ink-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  )
}

function SortableMediaItem({
  item,
  isCoverPhoto,
  layout,
  onRemovePhoto,
  onRemoveVideo,
}: {
  item: GalleryItem
  isCoverPhoto: boolean
  layout: 'horizontal' | 'grid'
  onRemovePhoto: (id: string) => void
  onRemoveVideo: (id: string) => void
}) {
  const itemKey = galleryItemKey(item)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: itemKey })

  const [pointerDown, setPointerDown] = useState(false)
  const showGrabbing = isDragging || pointerDown
  const isHorizontal = layout === 'horizontal'

  useEffect(() => {
    if (!pointerDown || isDragging) return
    function clearPointerDown() {
      setPointerDown(false)
    }
    window.addEventListener('pointerup', clearPointerDown)
    window.addEventListener('pointercancel', clearPointerDown)
    return () => {
      window.removeEventListener('pointerup', clearPointerDown)
      window.removeEventListener('pointercancel', clearPointerDown)
    }
  }, [pointerDown, isDragging])

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : 1,
    zIndex: isDragging ? 10 : undefined,
  }

  const touchBlockStyle: React.CSSProperties = {
    WebkitTouchCallout: 'none',
    WebkitUserSelect: 'none',
    userSelect: 'none',
  }

  const isVideo = item.kind === 'video'
  const slot = isVideo ? item.slot : null
  const isUploading = Boolean(slot?.status === 'uploading' && !slot.uploadComplete)
  const isProcessing = Boolean(
    slot &&
      (slot.status === 'processing' || (slot.status === 'uploading' && slot.uploadComplete)),
  )
  const isReady = Boolean(slot?.status === 'ready' && slot.mux_playback_id)

  const previewSrc = isVideo
    ? (isReady && slot?.mux_playback_id
        ? muxThumbnailUrl(slot.mux_playback_id)
        : slot?.localPreviewUrl)
    : item.url

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        'relative overflow-hidden border border-[#E8E9EA] bg-[#F0F0F0] rounded-[10px]',
        isHorizontal ? 'shrink-0 w-24 h-24' : 'aspect-square w-full',
        isDragging ? 'shadow-card-hover border-orange' : '',
        !isHorizontal ? 'group' : '',
        showGrabbing ? 'cursor-grabbing' : 'cursor-grab',
      ].filter(Boolean).join(' ')}
    >
      {previewSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewSrc}
          alt=""
          draggable={false}
          className="h-full w-full object-cover pointer-events-none select-none"
          style={{ ...touchBlockStyle, WebkitUserDrag: 'none' } as React.CSSProperties}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[#F3F4F6]">
          <VideoIcon />
        </div>
      )}

      <div
        aria-label="Drag to reorder media"
        className={[
          'absolute inset-0 z-[1] touch-none select-none',
          showGrabbing ? 'cursor-grabbing' : 'cursor-grab',
        ].join(' ')}
        style={touchBlockStyle}
        {...attributes}
        {...listeners}
        onPointerDown={(event) => {
          setPointerDown(true)
          listeners?.onPointerDown?.(event)
        }}
      />

      {isCoverPhoto && (
        <div className="absolute top-1 left-1 z-[2] w-5 h-5 bg-orange rounded-full flex items-center justify-center shadow-sm pointer-events-none">
          <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
      )}

      {isVideo && (
        <div className="absolute top-1 left-1 z-[2] rounded-pill bg-black/65 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white pointer-events-none">
          Video
        </div>
      )}

      {isUploading && (
        <div className="absolute inset-0 z-[4] flex flex-col items-center justify-center gap-2 bg-white/85 px-2 text-center pointer-events-none">
          <div className="h-1.5 w-3/4 overflow-hidden rounded-pill bg-[#E8E9EA]">
            <div
              className="h-full rounded-pill bg-orange transition-all"
              style={{ width: `${slot?.uploadProgress ?? 0}%` }}
            />
          </div>
          <span className="text-[10px] font-sans text-ink-2">
            Uploading… {slot?.uploadProgress ?? 0}%
          </span>
        </div>
      )}

      {isProcessing && !isUploading && (
        <div className="absolute inset-0 z-[4] flex flex-col items-center justify-center gap-2 bg-white/85 px-2 text-center pointer-events-none">
          <svg className="w-5 h-5 animate-spin text-ink-3" fill="none" viewBox="0 0 24 24" aria-hidden>
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-[10px] font-sans text-ink-2">Processing…</span>
        </div>
      )}

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          if (item.kind === 'photo') onRemovePhoto(item.id)
          else onRemoveVideo(item.slot.id)
        }}
        onPointerDown={(event) => event.stopPropagation()}
        aria-label={isVideo ? 'Remove video' : 'Remove photo'}
        className={[
          'absolute top-1 right-1 z-[5] rounded-full flex items-center justify-center cursor-pointer',
          isHorizontal
            ? 'w-6 h-6 bg-ink/70'
            : 'w-5 h-5 bg-ink/60 opacity-0 group-hover:opacity-100 hover:bg-ink transition-opacity',
        ].join(' ')}
      >
        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div
        aria-hidden
        className={[
          'absolute bottom-0 inset-x-0 z-[2] flex items-center justify-center pointer-events-none',
          'bg-ink/55 text-white touch-none select-none',
          isHorizontal ? 'h-7' : 'h-6 opacity-0 group-hover:opacity-100 transition-opacity',
        ].join(' ')}
        style={touchBlockStyle}
      >
        <GripVertical className="w-3.5 h-3.5" strokeWidth={2.5} aria-hidden />
      </div>
    </div>
  )
}

export default function ListingMediaGallery({
  items,
  onReorder,
  onRemovePhoto,
  onRemoveVideo,
  layout,
}: ListingMediaGalleryProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const firstPhotoId =
    items.find((item): item is Extract<GalleryItem, { kind: 'photo' }> => item.kind === 'photo')?.id ?? null

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex((item) => galleryItemKey(item) === active.id)
    const newIndex = items.findIndex((item) => galleryItemKey(item) === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    void onReorder(arrayMove(items, oldIndex, newIndex))
  }

  const isHorizontal = layout === 'horizontal'

  if (items.length === 0) return null

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={items.map((item) => galleryItemKey(item))}
        strategy={isHorizontal ? horizontalListSortingStrategy : rectSortingStrategy}
      >
        <div
          className={
            isHorizontal
              ? 'flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-1 px-1'
              : 'grid gap-2'
          }
          style={
            isHorizontal
              ? undefined
              : { gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))' }
          }
        >
          {items.map((item) => (
            <SortableMediaItem
              key={galleryItemKey(item)}
              item={item}
              isCoverPhoto={item.kind === 'photo' && item.id === firstPhotoId}
              layout={layout}
              onRemovePhoto={onRemovePhoto}
              onRemoveVideo={onRemoveVideo}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
