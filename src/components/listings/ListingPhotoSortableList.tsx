'use client'

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
import type { PhotoState } from './NewListingModal'

interface ListingPhotoSortableListProps {
  photos: PhotoState[]
  onReorder: (photos: PhotoState[]) => void
  onRemove: (id: string) => void
  layout: 'horizontal' | 'grid'
}

function SortablePhotoItem({
  photo,
  index,
  layout,
  onRemove,
}: {
  photo: PhotoState
  index: number
  layout: 'horizontal' | 'grid'
  onRemove: (id: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: photo.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : 1,
    zIndex: isDragging ? 10 : undefined,
  }

  const isHorizontal = layout === 'horizontal'

  const touchBlockStyle: React.CSSProperties = {
    WebkitTouchCallout: 'none',
    WebkitUserSelect: 'none',
    userSelect: 'none',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        'relative overflow-hidden border border-[#E8E9EA] bg-[#F0F0F0] rounded-[10px]',
        isHorizontal ? 'shrink-0 w-24 h-24' : 'aspect-square w-full',
        isDragging ? 'shadow-card-hover border-orange' : '',
        !isHorizontal ? 'group' : '',
      ].filter(Boolean).join(' ')}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.url}
        alt=""
        draggable={false}
        className="w-full h-full object-cover pointer-events-none select-none"
        style={{ ...touchBlockStyle, WebkitUserDrag: 'none' } as React.CSSProperties}
      />

      {/* Blocks iOS long-press save/share menu on the image; on mobile the whole tile is draggable */}
      {isHorizontal ? (
        <div
          aria-label="Drag to reorder photo"
          className="absolute inset-0 z-[1] touch-none select-none cursor-grab active:cursor-grabbing"
          style={touchBlockStyle}
          {...attributes}
          {...listeners}
        />
      ) : (
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 z-[1] touch-none select-none"
          style={{ ...touchBlockStyle, bottom: '24px' }}
        />
      )}

      {index === 0 && (
        <div className="absolute top-1 left-1 z-[2] w-5 h-5 bg-orange rounded-full flex items-center justify-center shadow-sm pointer-events-none">
          <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
      )}

      <button
        type="button"
        onClick={e => {
          e.stopPropagation()
          onRemove(photo.id)
        }}
        onPointerDown={e => e.stopPropagation()}
        aria-label="Remove photo"
        className={[
          'absolute top-1 right-1 z-[3] rounded-full flex items-center justify-center',
          isHorizontal
            ? 'w-6 h-6 bg-ink/70'
            : 'w-5 h-5 bg-ink/60 opacity-0 group-hover:opacity-100 hover:bg-ink transition-opacity',
        ].join(' ')}
      >
        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Grip — visual hint on mobile; drag target on desktop grid */}
      <button
        type="button"
        aria-label={isHorizontal ? undefined : 'Drag to reorder photo'}
        aria-hidden={isHorizontal ? true : undefined}
        tabIndex={isHorizontal ? -1 : undefined}
        className={[
          'absolute bottom-0 inset-x-0 z-[2] flex items-center justify-center',
          'bg-ink/55 text-white touch-none select-none',
          isHorizontal ? 'h-7 pointer-events-none' : 'h-6 opacity-0 group-hover:opacity-100 transition-opacity',
        ].join(' ')}
        style={touchBlockStyle}
        {...(!isHorizontal ? { ...attributes, ...listeners } : {})}
      >
        <GripVertical className="w-3.5 h-3.5" strokeWidth={2.5} aria-hidden />
      </button>
    </div>
  )
}

export default function ListingPhotoSortableList({
  photos,
  onReorder,
  onRemove,
  layout,
}: ListingPhotoSortableListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = photos.findIndex(p => p.id === active.id)
    const newIndex = photos.findIndex(p => p.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    onReorder(arrayMove(photos, oldIndex, newIndex))
  }

  const isHorizontal = layout === 'horizontal'

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={photos.map(p => p.id)}
        strategy={isHorizontal ? horizontalListSortingStrategy : rectSortingStrategy}
      >
        <div
          className={
            isHorizontal
              ? 'flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-1 px-1'
              : 'grid gap-2 mt-2'
          }
          style={
            isHorizontal
              ? undefined
              : { gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))' }
          }
        >
          {photos.map((photo, idx) => (
            <SortablePhotoItem
              key={photo.id}
              photo={photo}
              index={idx}
              layout={layout}
              onRemove={onRemove}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
