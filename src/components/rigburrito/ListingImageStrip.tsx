'use client'

import Image from 'next/image'
import { useCallback, useState } from 'react'
import { createPortal } from 'react-dom'

const PREVIEW_WIDTH = 720
const PREVIEW_HEIGHT = 540
const VIEWPORT_PADDING = 12

interface ListingImageStripProps {
  images: { url: string }[]
}

/** Top-right corner of preview anchored to cursor; preview extends left and down. */
function clampPosition(clientX: number, clientY: number) {
  let x = clientX - PREVIEW_WIDTH
  let y = clientY

  x = Math.max(VIEWPORT_PADDING, Math.min(x, window.innerWidth - PREVIEW_WIDTH - VIEWPORT_PADDING))
  y = Math.max(VIEWPORT_PADDING, Math.min(y, window.innerHeight - PREVIEW_HEIGHT - VIEWPORT_PADDING))

  return { x, y }
}

export default function ListingImageStrip({ images }: ListingImageStripProps) {
  const [preview, setPreview] = useState<{ url: string; x: number; y: number } | null>(null)

  const showPreview = useCallback((e: React.MouseEvent<HTMLDivElement>, url: string) => {
    const { x, y } = clampPosition(e.clientX, e.clientY)
    setPreview({ url, x, y })
  }, [])

  const hidePreview = useCallback(() => setPreview(null), [])

  return (
    <>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {images.map((img, i) => (
          <div
            key={img.url + i}
            className="shrink-0 cursor-zoom-in rounded"
            onMouseEnter={e => showPreview(e, img.url)}
            onMouseMove={e => showPreview(e, img.url)}
            onMouseLeave={hidePreview}
          >
            <Image
              src={img.url}
              alt=""
              width={120}
              height={90}
              className="rounded object-cover"
              style={{ width: 120, height: 90 }}
            />
          </div>
        ))}
      </div>

      {preview && typeof document !== 'undefined' && createPortal(
        <div
          className="rigburrito-image-hover-preview"
          style={{
            left: preview.x,
            top: preview.y,
            width: PREVIEW_WIDTH,
            height: PREVIEW_HEIGHT,
          }}
          aria-hidden="true"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview.url} alt="" className="rigburrito-image-hover-preview-img" />
        </div>,
        document.body,
      )}
    </>
  )
}
