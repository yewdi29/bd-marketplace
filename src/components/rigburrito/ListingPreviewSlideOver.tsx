'use client'

import { useEffect, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import ListingImageStrip from '@/components/rigburrito/ListingImageStrip'
import SlideOver from '@/components/rigburrito/SlideOver'
import { formatPriceAmount } from '@/lib/formatPrice'

interface ListingPreviewSlideOverProps {
  listingId: string | null
  onClose: () => void
}

export default function ListingPreviewSlideOver({ listingId, onClose }: ListingPreviewSlideOverProps) {
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!listingId) {
      setDetail(null)
      setError('')
      return
    }

    let cancelled = false
    setLoading(true)
    setError('')
    setDetail(null)

    fetch(`/api/rigburrito/listings/${listingId}`)
      .then(async res => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Failed to load listing')
        if (!cancelled) setDetail(data.listing)
      })
      .catch(err => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load listing')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [listingId])

  const images = (detail?.listing_images as { url: string }[] | undefined) ?? []
  const slug = detail?.slug as string | undefined

  return (
    <SlideOver
      open={listingId != null}
      onOpenChange={open => { if (!open) onClose() }}
      title="Listing Preview"
      width="580px"
      footer={slug ? (
        <a
          href={`/listings/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rigburrito-btn rigburrito-btn-muted no-underline"
        >
          <ExternalLink size={14} strokeWidth={2} />
          View Public
        </a>
      ) : undefined}
    >
      {loading && <p className="rigburrito-body" style={{ color: '#6B7280' }}>Loading listing…</p>}
      {error && <p className="rigburrito-body text-red-600">{error}</p>}
      {!loading && !error && detail && (
        <div className="space-y-4">
          {images.length > 0 && <ListingImageStrip images={images} />}
          <div>
            <p className="rigburrito-card-label">Title</p>
            <p className="rigburrito-body mt-1 font-medium">{String(detail.title)}</p>
          </div>
          <div>
            <p className="rigburrito-card-label">Price</p>
            <p className="rigburrito-mono rigburrito-body mt-1">
              {formatPriceAmount(
                Number(detail.price),
                String(detail.price_unit ?? 'total'),
              )}
            </p>
          </div>
          <div>
            <p className="rigburrito-card-label">Description</p>
            <p className="rigburrito-body mt-1">{String(detail.description ?? '—')}</p>
          </div>
        </div>
      )}
    </SlideOver>
  )
}
