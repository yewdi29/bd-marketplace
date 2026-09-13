'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, Flag, Trash2 } from 'lucide-react'
import AdminButton from '@/components/rigburrito/AdminButton'
import ListingImageStrip from '@/components/rigburrito/ListingImageStrip'
import StatusBadge from '@/components/rigburrito/StatusBadge'
import { formatPriceAmount } from '@/lib/formatPrice'

type ReviewAction = 'confirm_flag' | 'reject' | 'override'

interface ReviewListing {
  id: string
  title: string
  slug: string | null
  status: string
  description: string | null
  price: number
  price_unit: string | null
  price_visible: boolean
  location_city: string | null
  location_state: string | null
  year: number | null
  manufacturer: string | null
  model: string | null
  condition: string | null
  users: { full_name: string | null; email: string | null; company_name: string | null } | null
  industries: { name: string } | null
  categories: { name: string } | null
  listing_images: { id: string; url: string; alt_text: string | null; sort_order: number; is_primary: boolean }[]
}

interface ReviewPayload {
  usable: boolean
  unusable_reason: 'used' | 'expired' | 'resolved' | null
  listing: ReviewListing
  recommendation: {
    id: string
    confidence_score: number | null
    reasoning: string | null
    flag_comment: string | null
    recommended_action: string
  }
}

function unusableMessage(reason: ReviewPayload['unusable_reason']): string {
  if (reason === 'used' || reason === 'resolved') {
    return 'This review has already been completed. The link is no longer valid.'
  }
  if (reason === 'expired') {
    return 'This review link has expired. Open the listing from command center if it still needs a decision.'
  }
  return 'This review link is invalid or incomplete.'
}

export default function ListingVerificationReviewPage() {
  return (
    <Suspense fallback={<p className="rigburrito-body" style={{ color: '#6B7280' }}>Loading review…</p>}>
      <ListingVerificationReviewForm />
    </Suspense>
  )
}

function ListingVerificationReviewForm() {
  const searchParams = useSearchParams()
  // Hold token inertly from the email link — GET is read-only; mutations only on button click.
  const tokenHash = searchParams.get('token_hash')?.trim() ?? ''

  const [payload, setPayload] = useState<ReviewPayload | null>(null)
  const [loading, setLoading] = useState(Boolean(tokenHash))
  const [error, setError] = useState('')
  const [removalReason, setRemovalReason] = useState('')
  const [overrideNote, setOverrideNote] = useState('')
  const [submitting, setSubmitting] = useState<ReviewAction | null>(null)
  const [done, setDone] = useState<ReviewAction | null>(null)

  useEffect(() => {
    if (!tokenHash) {
      setLoading(false)
      setError('This review link is invalid or incomplete.')
      return
    }

    let cancelled = false
    setLoading(true)
    setError('')

    const params = new URLSearchParams({ token_hash: tokenHash })
    fetch(`/api/rigburrito/listing-review?${params.toString()}`)
      .then(async res => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Failed to load review')
        if (!cancelled) setPayload(data as ReviewPayload)
      })
      .catch(err => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load review')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [tokenHash])

  const images = useMemo(() => {
    const rows = payload?.listing.listing_images ?? []
    return [...rows].sort((a, b) => {
      if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1
      return (a.sort_order ?? 0) - (b.sort_order ?? 0)
    })
  }, [payload])

  async function submitAction(action: ReviewAction) {
    if (!tokenHash || !payload?.usable || submitting || done) return

    if (action === 'reject' && removalReason.trim().length < 20) {
      setError('Removal reason must be at least 20 characters')
      return
    }

    setSubmitting(action)
    setError('')

    try {
      const res = await fetch('/api/rigburrito/listing-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token_hash: tokenHash,
          action,
          removal_reason: action === 'reject' ? removalReason.trim() : undefined,
          override_note: action === 'override' ? overrideNote.trim() || undefined : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Action failed')
      setDone(action)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setSubmitting(null)
    }
  }

  if (loading) {
    return <p className="rigburrito-body" style={{ color: '#6B7280' }}>Loading review…</p>
  }

  if (!payload) {
    return (
      <div>
        <h1 className="rigburrito-page-title">Listing review</h1>
        <div className="rigburrito-card p-6">
          <p className="rigburrito-body text-red-600">{error || 'This review link is invalid or incomplete.'}</p>
        </div>
      </div>
    )
  }

  const listing = payload.listing
  const seller = listing.users
  const location = [listing.location_city, listing.location_state].filter(Boolean).join(', ')
  const category = listing.industries?.name ?? listing.categories?.name ?? '—'
  const specLine = [listing.year, listing.manufacturer, listing.model, listing.condition]
    .filter(Boolean)
    .join(' ')
  const canAct = payload.usable && !done

  return (
    <div>
      <h1 className="rigburrito-page-title">Listing review</h1>
      <p className="rigburrito-body mb-6" style={{ color: '#6B7280' }}>
        Low-score verification — no action runs until you click one of the buttons below.
      </p>

      {!canAct && (
        <div className="rigburrito-card mb-6 p-4" style={{ background: '#F0FDF4', borderColor: '#BBF7D0' }}>
          <p className="rigburrito-body" style={{ color: '#16A34A' }}>
            {done === 'confirm_flag' && 'Flag confirmed. The seller was sent the existing ListingNeedsChanges email and the listing is now a draft.'}
            {done === 'reject' && 'Listing removed. The seller was sent the existing ListingRemoved email.'}
            {done === 'override' && 'Override recorded. The listing was published with the shared approve path.'}
            {!done && unusableMessage(payload.unusable_reason)}
          </p>
        </div>
      )}

      {error && (
        <div className="rigburrito-card mb-6 p-4" style={{ background: '#FEF2F2', borderColor: '#FECACA' }}>
          <p className="rigburrito-body text-red-600">{error}</p>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rigburrito-card space-y-4 p-6">
          {images.length > 0 && <ListingImageStrip images={images} />}
          <div>
            <p className="rigburrito-card-label">Title</p>
            <p className="rigburrito-body mt-1 font-medium">{listing.title}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={listing.status} />
            {listing.slug && (
              <a
                href={`/listings/${listing.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rigburrito-text-link text-sm"
              >
                View listing
              </a>
            )}
          </div>
          <div>
            <p className="rigburrito-card-label">Price</p>
            <p className="rigburrito-mono rigburrito-body mt-1">
              {formatPriceAmount(Number(listing.price), String(listing.price_unit ?? 'total'))}
            </p>
          </div>
          <div>
            <p className="rigburrito-card-label">Category</p>
            <p className="rigburrito-body mt-1">{category}</p>
          </div>
          {specLine && (
            <div>
              <p className="rigburrito-card-label">Specs</p>
              <p className="rigburrito-body mt-1">{specLine}</p>
            </div>
          )}
          <div>
            <p className="rigburrito-card-label">Location</p>
            <p className="rigburrito-body mt-1">{location || '—'}</p>
          </div>
          <div>
            <p className="rigburrito-card-label">Seller</p>
            <p className="rigburrito-body mt-1">
              {seller?.full_name || seller?.company_name || '—'}
              {seller?.email ? ` · ${seller.email}` : ''}
            </p>
          </div>
          <div>
            <p className="rigburrito-card-label">Description</p>
            <p className="rigburrito-body mt-1 whitespace-pre-wrap">{listing.description || '—'}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rigburrito-card space-y-4 p-6">
            <div>
              <p className="rigburrito-card-label">Agent score</p>
              <p className="rigburrito-mono mt-1" style={{ fontSize: 32, fontWeight: 700, color: '#0F1117' }}>
                {payload.recommendation.confidence_score ?? '—'}
              </p>
            </div>
            <div>
              <p className="rigburrito-card-label">Reasoning</p>
              <p className="rigburrito-body mt-1 whitespace-pre-wrap">
                {payload.recommendation.reasoning || '—'}
              </p>
            </div>
            <div>
              <p className="rigburrito-card-label">Recommended seller feedback</p>
              <p className="rigburrito-body mt-1 whitespace-pre-wrap">
                {payload.recommendation.flag_comment || '—'}
              </p>
            </div>
          </div>

          <div className="rigburrito-card space-y-4 p-6">
            <h2 className="rigburrito-section-title">Decide</h2>

            <div className="space-y-2">
              <AdminButton
                variant="warning"
                disabled={!canAct || submitting != null}
                onClick={() => { void submitAction('confirm_flag') }}
              >
                <Flag size={14} strokeWidth={2} />
                {submitting === 'confirm_flag' ? 'Sending feedback…' : 'Confirm flag, send feedback'}
              </AdminButton>
              <p className="rigburrito-caption">Sends the existing ListingNeedsChanges email and moves the listing to draft.</p>
            </div>

            <div className="space-y-2">
              <label className="rigburrito-card-label block" htmlFor="removal-reason">
                Removal reason — required for reject
              </label>
              <textarea
                id="removal-reason"
                value={removalReason}
                onChange={e => setRemovalReason(e.target.value)}
                rows={4}
                disabled={!canAct}
                className="rigburrito-textarea w-full"
                placeholder="Explain why this listing is being removed (minimum 20 characters)..."
              />
              <AdminButton
                variant="danger"
                disabled={!canAct || submitting != null || removalReason.trim().length < 20}
                onClick={() => { void submitAction('reject') }}
              >
                <Trash2 size={14} strokeWidth={2} />
                {submitting === 'reject' ? 'Removing…' : 'Reject (policy violation)'}
              </AdminButton>
              <p className="rigburrito-caption">Uses the existing ListingRemoved flow. Type a real reason — nothing is pre-filled.</p>
            </div>

            <div className="space-y-2">
              <label className="rigburrito-card-label block" htmlFor="override-note">
                Override note — optional
              </label>
              <textarea
                id="override-note"
                value={overrideNote}
                onChange={e => setOverrideNote(e.target.value)}
                rows={3}
                disabled={!canAct}
                className="rigburrito-textarea w-full"
                placeholder="Why the agent score was wrong (optional)..."
              />
              <AdminButton
                variant="success"
                disabled={!canAct || submitting != null}
                onClick={() => { void submitAction('override') }}
              >
                <CheckCircle size={14} strokeWidth={2} />
                {submitting === 'override' ? 'Publishing…' : 'Override (approve anyway)'}
              </AdminButton>
              <p className="rigburrito-caption">Publishes with the shared approve path. The note is logged for later grading, not required.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
