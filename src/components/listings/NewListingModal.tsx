'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { formatPrice } from '@/lib/formatPrice'

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: 'drilling_rig', label: 'Drilling Rig' },
  { value: 'drill_pipe', label: 'Drill Pipe' },
  { value: 'drill_collar', label: 'Drill Collar' },
  { value: 'blowout_preventer', label: 'Blowout Preventer (BOP)' },
  { value: 'wellhead', label: 'Wellhead Equipment' },
  { value: 'pumping_unit', label: 'Pumping Unit' },
  { value: 'artificial_lift', label: 'Artificial Lift' },
  { value: 'wireline', label: 'Wireline Equipment' },
  { value: 'coiled_tubing', label: 'Coiled Tubing' },
  { value: 'completion_equipment', label: 'Completion Equipment' },
  { value: 'production_equipment', label: 'Production Equipment' },
  { value: 'compressor', label: 'Compressor' },
  { value: 'separator', label: 'Separator' },
  { value: 'tank', label: 'Tank' },
  { value: 'flowline', label: 'Flowline & Piping' },
  { value: 'electrical', label: 'Electrical Equipment' },
  { value: 'safety', label: 'Safety Equipment' },
  { value: 'rental_tools', label: 'Rental Tools' },
  { value: 'other', label: 'Other' },
]

const US_STATES = [
  { value: 'AL', label: 'Alabama' }, { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' }, { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' }, { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' }, { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' }, { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' }, { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' }, { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' }, { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' }, { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' }, { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' }, { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' }, { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' }, { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' }, { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' }, { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' }, { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' }, { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' }, { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' }, { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' }, { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' }, { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' }, { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' }, { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' }, { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' }, { value: 'WY', label: 'Wyoming' },
]

const CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'parts_only', label: 'Parts Only' },
]

const PRICE_UNITS = [
  { value: 'total', label: 'Total Price' },
  { value: 'per_foot', label: 'Per Foot' },
  { value: 'per_piece', label: 'Per Piece' },
  { value: 'per_ton', label: 'Per Ton' },
  { value: 'per_set', label: 'Per Set' },
  { value: 'per_meter', label: 'Per Meter' },
]

const STEP_LABELS = ['Describe', 'Review & Refine', 'Photos & Video', 'Publish']

// ─── Types ────────────────────────────────────────────────────────────────────

interface PhotoState {
  id: string
  url: string
}

interface ListingForm {
  title: string
  category: string
  manufacturer: string
  model: string
  year: string
  condition: string
  price: string
  price_unit: string
  price_visible: boolean
  location_city: string
  location_state: string
  description: string
}

const EMPTY_FORM: ListingForm = {
  title: '',
  category: '',
  manufacturer: '',
  model: '',
  year: '',
  condition: '',
  price: '',
  price_unit: 'total',
  price_visible: true,
  location_city: '',
  location_state: '',
  description: '',
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  onClose: () => void
  onSuccess: (toast?: string) => void
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputCls =
  'w-full px-4 py-2.5 text-sm font-sans text-ink bg-white border border-[#D4D5D7] rounded-[10px] outline-none focus:border-orange focus:ring-2 focus:ring-orange/20 transition-colors placeholder:text-ink-3'

const selectCls =
  'w-full px-4 py-2.5 text-sm font-sans text-ink bg-white border border-[#D4D5D7] rounded-[10px] outline-none focus:border-orange focus:ring-2 focus:ring-orange/20 transition-colors appearance-none cursor-pointer'

const labelCls = 'block text-sm font-semibold text-ink mb-1.5'

// ─── Sub-components ───────────────────────────────────────────────────────────

function SelectWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <svg
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3"
        fill="none" viewBox="0 0 24 24" stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  )
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  )
}

// Progress breadcrumb
function Breadcrumb({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEP_LABELS.map((label, i) => {
        const idx = i + 1
        const isCompleted = idx < step
        const isActive = idx === step

        return (
          <div key={label} className="flex items-center">
            {/* Step indicator */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                style={{
                  background: isCompleted ? '#1A1D20' : isActive ? '#FF6B35' : '#F0F0F0',
                  border: `2px solid ${isCompleted ? '#1A1D20' : isActive ? '#FF6B35' : '#D4D5D7'}`,
                }}
              >
                {isCompleted ? (
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="text-xs font-bold" style={{ color: isActive ? '#fff' : '#9A9DA2' }}>
                    {idx}
                  </span>
                )}
              </div>
              <span
                className="text-[11px] font-medium whitespace-nowrap"
                style={{ color: isActive ? '#FF6B35' : isCompleted ? '#1A1D20' : '#9A9DA2' }}
              >
                {label}
              </span>
            </div>

            {/* Connector line */}
            {i < STEP_LABELS.length - 1 && (
              <div
                className="w-12 h-px mx-1 mb-5 transition-colors"
                style={{ background: isCompleted ? '#1A1D20' : '#E8E9EA' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function NewListingModal({ onClose, onSuccess }: Props) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [listingId, setListingId] = useState<string | null>(null)
  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [stepLoading, setStepLoading] = useState(false)
  const [discardConfirm, setDiscardConfirm] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<ListingForm>(EMPTY_FORM)
  const [photos, setPhotos] = useState<PhotoState[]>([])
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [dropIdx, setDropIdx] = useState<number | null>(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [videoError, setVideoError] = useState('')
  const [priceError, setPriceError] = useState('')

  const [upgradePrompt, setUpgradePrompt] = useState(false)
  const draftCreated = useRef(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Create draft on mount — exactly once (ref guards against Strict Mode double-invoke)
  useEffect(() => {
    if (draftCreated.current) return
    draftCreated.current = true

    fetch('/api/listings/draft', { method: 'POST' })
      .then(r => r.json())
      .then((d: { listing_id?: string; error?: string; upgrade?: boolean }) => {
        if (d.listing_id) {
          setListingId(d.listing_id)
        } else if (d.upgrade) {
          setUpgradePrompt(true)
          setError(d.error ?? 'Upgrade your membership for more listings.')
        } else {
          setError(d.error ?? 'Could not start a new listing. Please try again.')
        }
      })
      .catch(() => setError('Network error. Please try again.'))
  }, [])

  // ── Step 1: Generate ────────────────────────────────────────────────────────

  async function handleGenerate() {
    if (!listingId) return
    setGenerating(true)
    setError('')

    try {
      const res = await fetch('/api/listings/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, listing_id: listingId }),
      })
      const data = await res.json() as {
        listing?: Partial<ListingForm & { price: number; price_visible: boolean }>
        error?: string
      }

      if (!res.ok || !data.listing) {
        setError(data.error ?? 'Generation failed. Please try again.')
        return
      }

      const l = data.listing
      setForm({
        title: l.title ?? '',
        category: l.category ?? '',
        manufacturer: l.manufacturer ?? '',
        model: l.model ?? '',
        year: l.year != null ? String(l.year) : '',
        condition: l.condition ?? '',
        price: l.price != null && l.price > 0 ? String(l.price) : '',
        price_unit: (l as { price_unit?: string }).price_unit ?? 'total',
        price_visible: l.price_visible !== false,
        location_city: l.location_city ?? '',
        location_state: l.location_state ?? '',
        description: l.description ?? '',
      })
      setStep(2)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  // ── Step 2: Save fields ─────────────────────────────────────────────────────

  function validatePrice(): boolean {
    if (!form.price || parseFloat(form.price) <= 0) {
      setPriceError('Price is required to publish your listing.')
      return false
    }
    setPriceError('')
    return true
  }

  async function handleSaveFields() {
    if (!listingId) return
    if (!validatePrice()) return
    setStepLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/listings/${listingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          price: parseFloat(form.price) || 0,
          year: form.year ? parseInt(form.year) : null,
        }),
      })
      if (!res.ok) {
        const d = await res.json() as { error?: string }
        setError(d.error ?? 'Save failed. Please try again.')
        return
      }
      setStep(3)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setStepLoading(false)
    }
  }

  // ── Step 3: Photos ──────────────────────────────────────────────────────────

  async function handleFileSelect(files: FileList) {
    if (!listingId) return
    const remaining = 20 - photos.length
    const toUpload = Array.from(files).slice(0, remaining)

    setUploadingPhoto(true)
    setError('')

    for (const file of toUpload) {
      const fd = new FormData()
      fd.append('file', file)

      try {
        const res = await fetch(`/api/listings/${listingId}/images`, { method: 'POST', body: fd })
        const data = await res.json() as { image?: { id: string; url: string }; error?: string }
        if (data.image) {
          setPhotos(prev => [...prev, { id: data.image!.id, url: data.image!.url }])
        }
      } catch {
        // Continue uploading remaining files
      }
    }

    setUploadingPhoto(false)
  }

  async function handleRemovePhoto(imageId: string) {
    if (!listingId) return
    await fetch(`/api/listings/${listingId}/images?imageId=${imageId}`, { method: 'DELETE' })
    setPhotos(prev => prev.filter(p => p.id !== imageId))
  }

  function handleDrop(targetIdx: number) {
    if (dragIdx === null || dragIdx === targetIdx) {
      setDragIdx(null)
      setDropIdx(null)
      return
    }
    const reordered = [...photos]
    const [moved] = reordered.splice(dragIdx, 1)
    reordered.splice(targetIdx, 0, moved)
    setPhotos(reordered)
    setDragIdx(null)
    setDropIdx(null)
  }

  function isValidYouTubeUrl(url: string): boolean {
    return /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?.*v=|embed\/|shorts\/)|youtu\.be\/)[\w-]{11}/.test(url)
  }

  async function handleSavePhotos() {
    if (!listingId) return

    // Validate video URL if provided
    if (videoUrl.trim() && !isValidYouTubeUrl(videoUrl.trim())) {
      setVideoError('Please enter a valid YouTube URL.')
      return
    }

    setStepLoading(true)
    setError('')

    try {
      // Save image order + video URL
      await fetch(`/api/listings/${listingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_order: photos.map(p => p.id),
          video_url: videoUrl.trim() || null,
        }),
      })
      setStep(4)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setStepLoading(false)
    }
  }

  // ── Step 4: Publish / Save as Draft ────────────────────────────────────────

  async function handleSaveAsDraft() {
    if (!listingId) return
    // Price is required even when saving as draft from step 2
    if (step === 2 && !validatePrice()) return
    setStepLoading(true)

    await fetch(`/api/listings/${listingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'draft' }),
    })

    setStepLoading(false)
    onSuccess()
    onClose()
  }

  async function handlePublish() {
    if (!listingId) return
    setStepLoading(true)
    setError('')

    const res = await fetch(`/api/listings/${listingId}/publish`, { method: 'PATCH' })
    if (!res.ok) {
      const d = await res.json() as { error?: string }
      setError(d.error ?? 'Publish failed. Please try again.')
      setStepLoading(false)
      return
    }

    setStepLoading(false)
    onSuccess('Your listing is now live')
    onClose()
  }

  // ── Discard ────────────────────────────────────────────────────────────────

  const handleDiscard = useCallback(async () => {
    if (listingId) {
      await fetch(`/api/listings/${listingId}`, { method: 'DELETE' })
    }
    onClose()
  }, [listingId, onClose])

  function handleCloseAttempt() {
    if (listingId) {
      setDiscardConfirm(true)
    } else {
      onClose()
    }
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  function handleBack() {
    setError('')
    setStep(prev => (prev > 1 ? ((prev - 1) as 1 | 2 | 3 | 4) : prev))
  }

  function handleNext() {
    setError('')
    if (step === 1) handleGenerate()
    else if (step === 2) handleSaveFields()
    else if (step === 3) handleSavePhotos()
  }

  const nextLabel =
    step === 1 ? (generating ? 'Generating…' : 'Generate Listing →')
    : step === 4 ? null
    : stepLoading ? 'Saving…'
    : step === 3 ? 'Review Listing →'
    : 'Next →'

  const nextDisabled =
    (step === 1 && (generating || prompt.trim().length < 10)) ||
    stepLoading

  // ── Category label helper ───────────────────────────────────────────────────

  function catLabel(val: string) {
    return CATEGORIES.find(c => c.value === val)?.label ?? val
  }

  function condLabel(val: string) {
    return CONDITIONS.find(c => c.value === val)?.label ?? val
  }

  function condPillStyle(val: string): React.CSSProperties {
    switch (val) {
      case 'new':
        return { background: '#FFF2ED', color: '#FF6B35', borderColor: '#FF6B35' }
      case 'like_new':
        return { background: '#F0FFF0', color: '#1A5C18', borderColor: '#C8F5C4' }
      case 'good':
        return { background: '#EFF6FF', color: '#1E40AF', borderColor: '#BFDBFE' }
      case 'fair':
        return { background: '#FDF6E3', color: '#7A5C00', borderColor: '#F0D98A' }
      case 'parts_only':
        return { background: '#FFF0F0', color: '#CC0000', borderColor: '#FFCCCC' }
      default:
        return { borderColor: '#E8E9EA', color: '#9A9DA2' }
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}>
      <div
        className="relative w-full bg-white flex flex-col"
        style={{ maxWidth: '720px', borderRadius: '20px', maxHeight: '90vh', boxShadow: '0 32px 80px rgba(0,0,0,0.20)' }}
      >
        {/* ── Discard confirmation overlay ── */}
        {discardConfirm && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[20px]" style={{ background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(4px)' }}>
            <div className="text-center px-8 max-w-xs">
              <div className="w-12 h-12 rounded-full bg-[#FEE2E2] flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-[#DC2626]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="font-sans font-bold text-lg text-ink mb-2" style={{ letterSpacing: '-0.02em' }}>
                Discard this listing?
              </h3>
              <p className="text-sm text-ink-2 mb-6 leading-relaxed">
                All content and uploaded photos will be permanently deleted.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDiscardConfirm(false)}
                  className="flex-1 py-2.5 text-sm font-bold text-ink border border-[#D4D5D7] rounded-pill hover:border-ink transition-colors"
                >
                  Keep Editing
                </button>
                <button
                  onClick={handleDiscard}
                  className="flex-1 py-2.5 text-sm font-bold text-white bg-[#DC2626] rounded-pill hover:bg-[#B91C1C] transition-colors"
                >
                  Discard
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Fixed header ── */}
        <div className="shrink-0 px-8 pt-7 pb-0">
          {/* X close button */}
          <button
            onClick={handleCloseAttempt}
            className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full hover:bg-bg text-ink-3 hover:text-ink transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <Breadcrumb step={step} />
        </div>

        {/* ── Scrollable content ── */}
        <div className="flex-1 overflow-y-auto px-8 pb-4">

          {/* Error banner */}
          {error && (
            <div className="mb-4 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3">
              {upgradePrompt ? (
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-sans text-red-600">{error}</p>
                  <button
                    onClick={() => { onClose(); router.push('/dashboard/upgrade') }}
                    className="shrink-0 px-3 py-1.5 text-xs font-bold text-white rounded-pill transition-colors"
                    style={{ background: '#FF6B35', boxShadow: '0 2px 8px rgba(255,107,53,0.30)' }}
                  >
                    Upgrade
                  </button>
                </div>
              ) : (
                <p className="text-sm font-sans text-red-600">{error}</p>
              )}
            </div>
          )}

          {/* ─────── STEP 1: Describe ─────── */}
          {step === 1 && (
            <div>
              <h2 className="font-sans font-bold text-[22px] text-ink mb-1" style={{ letterSpacing: '-0.02em' }}>
                Describe your equipment
              </h2>
              <p className="text-sm text-ink-2 mb-5 leading-relaxed">
                Just talk to us like you would a buyer. Our AI will extract all the details and build your listing.
              </p>
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder="Describe your equipment in your own words — what it is, condition, specs, price, and location. Just talk to us like you would a buyer."
                  className={`${inputCls} resize-none leading-relaxed`}
                  style={{ minHeight: '200px' }}
                  disabled={generating}
                />
                <span className="absolute bottom-3 right-3 text-xs font-mono text-ink-3">
                  {prompt.length}
                </span>
              </div>
            </div>
          )}

          {/* ─────── STEP 2: Review & Refine ─────── */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="font-sans font-bold text-[22px] text-ink mb-1" style={{ letterSpacing: '-0.02em' }}>
                  Review & refine
                </h2>
                <p className="text-sm text-ink-2 mb-5">
                  Your listing was generated by AI. Edit any field before continuing.
                </p>
              </div>

              {/* Title */}
              <FormField label="Title">
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className={inputCls}
                  placeholder="e.g. 2018 National 12P-160 Drilling Rig"
                />
              </FormField>

              {/* Category + Condition row */}
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Category">
                  <SelectWrapper>
                    <select
                      value={form.category}
                      onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                      className={selectCls}
                    >
                      <option value="">Select category</option>
                      {CATEGORIES.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </SelectWrapper>
                </FormField>
                <FormField label="Condition">
                  <SelectWrapper>
                    <select
                      value={form.condition}
                      onChange={e => setForm(f => ({ ...f, condition: e.target.value }))}
                      className={selectCls}
                    >
                      <option value="">Select condition</option>
                      {CONDITIONS.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </SelectWrapper>
                </FormField>
              </div>

              {/* Manufacturer + Model row */}
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Manufacturer">
                  <input
                    type="text"
                    value={form.manufacturer}
                    onChange={e => setForm(f => ({ ...f, manufacturer: e.target.value }))}
                    className={inputCls}
                    placeholder="e.g. National, Gardner Denver"
                  />
                </FormField>
                <FormField label="Model">
                  <input
                    type="text"
                    value={form.model}
                    onChange={e => setForm(f => ({ ...f, model: e.target.value }))}
                    className={inputCls}
                    placeholder="e.g. 12P-160"
                  />
                </FormField>
              </div>

              {/* Year */}
              <FormField label="Year">
                <input
                  type="number"
                  value={form.year}
                  onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
                  className={`${inputCls} font-mono`}
                  placeholder="e.g. 2018"
                  min={1900}
                  max={new Date().getFullYear() + 1}
                />
              </FormField>

              {/* Price + unit + visibility toggle */}
              <FormField label="Price (USD)">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3 text-sm font-sans pointer-events-none">$</span>
                    <input
                      type="number"
                      value={form.price}
                      onChange={e => {
                        setForm(f => ({ ...f, price: e.target.value }))
                        if (priceError) setPriceError('')
                      }}
                      className={`${inputCls} pl-7 font-mono ${priceError ? 'border-orange focus:ring-orange/20' : ''}`}
                      placeholder="0"
                      min={0}
                    />
                  </div>
                  <SelectWrapper>
                    <select
                      value={form.price_unit}
                      onChange={e => setForm(f => ({ ...f, price_unit: e.target.value }))}
                      className={`${selectCls} w-[140px] shrink-0`}
                    >
                      {PRICE_UNITS.map(u => (
                        <option key={u.value} value={u.value}>{u.label}</option>
                      ))}
                    </select>
                  </SelectWrapper>
                </div>
                {/* Helper text */}
                <p style={{ fontSize: '12px', color: '#9A9DA2', lineHeight: 1.5, marginTop: '6px' }}>
                  A listed price significantly improves your listing&apos;s visibility in search results. If you prefer not to display it publicly, toggle &ldquo;Contact for price&rdquo; below.
                </p>
                {/* Inline price error */}
                {priceError && (
                  <p className="text-orange font-sans" style={{ fontSize: '12px', marginTop: '4px' }}>
                    {priceError}
                  </p>
                )}
                {/* Price visible toggle */}
                <label className="flex items-center gap-3 cursor-pointer select-none mt-2.5">
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, price_visible: !f.price_visible }))}
                    className="relative inline-flex shrink-0 cursor-pointer"
                    style={{ width: '36px', height: '20px' }}
                  >
                    <div
                      className="w-full h-full rounded-pill transition-colors"
                      style={{ background: form.price_visible ? '#FF6B35' : '#D4D5D7' }}
                    />
                    <div
                      className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform"
                      style={{ transform: form.price_visible ? 'translateX(18px)' : 'translateX(2px)' }}
                    />
                  </button>
                  <span className="text-sm text-ink-2">
                    {form.price_visible ? 'Price visible to buyers' : 'Show "Contact for price" instead'}
                  </span>
                </label>
              </FormField>

              {/* Location */}
              <div className="grid grid-cols-2 gap-4">
                <FormField label="City">
                  <input
                    type="text"
                    value={form.location_city}
                    onChange={e => setForm(f => ({ ...f, location_city: e.target.value }))}
                    className={inputCls}
                    placeholder="e.g. Midland"
                  />
                </FormField>
                <FormField label="State">
                  <SelectWrapper>
                    <select
                      value={form.location_state}
                      onChange={e => setForm(f => ({ ...f, location_state: e.target.value }))}
                      className={selectCls}
                    >
                      <option value="">Select state</option>
                      {US_STATES.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </SelectWrapper>
                </FormField>
              </div>

              {/* Description */}
              <FormField label="Description">
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className={`${inputCls} resize-none leading-relaxed`}
                  style={{ minHeight: '120px' }}
                  placeholder="Detailed equipment description for buyers…"
                />
              </FormField>
            </div>
          )}

          {/* ─────── STEP 3: Photos & Video ─────── */}
          {step === 3 && (
            <div>
              <h2 className="font-sans font-bold text-[22px] text-ink mb-1" style={{ letterSpacing: '-0.02em' }}>
                Photos &amp; video
              </h2>
              <p className="text-sm text-ink-2 mb-5">
                Add up to 20 photos. Drag to reorder — the first photo is the cover image.
              </p>

              {/* Drop zone */}
              <div
                className="border-2 border-dashed border-[#D4D5D7] rounded-[14px] flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-orange hover:bg-orange/[0.02] transition-colors"
                style={{ minHeight: photos.length === 0 ? '160px' : '80px', padding: '20px' }}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault()
                  if (e.dataTransfer.files.length) handleFileSelect(e.dataTransfer.files)
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg"
                  multiple
                  className="hidden"
                  onChange={e => { if (e.target.files) handleFileSelect(e.target.files) }}
                />
                {uploadingPhoto ? (
                  <div className="flex items-center gap-2 text-ink-3">
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span className="text-sm font-sans">Uploading…</span>
                  </div>
                ) : (
                  <>
                    <svg className="w-8 h-8 text-ink-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm font-sans text-ink-2">
                      <span className="font-semibold text-orange">Click to browse</span> or drag &amp; drop
                    </p>
                    <p className="text-xs text-ink-3">PNG, JPG — up to 20 photos</p>
                  </>
                )}
              </div>

              {/* Photo count */}
              {photos.length > 0 && (
                <p className="text-xs font-mono text-ink-3 mt-2 mb-3 text-right">
                  {photos.length} / 20 photos
                </p>
              )}

              {/* Thumbnail grid */}
              {photos.length > 0 && (
                <div
                  className="grid gap-2 mt-2"
                  style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))' }}
                >
                  {photos.map((photo, idx) => (
                    <div
                      key={photo.id}
                      draggable
                      onDragStart={() => setDragIdx(idx)}
                      onDragOver={e => { e.preventDefault(); setDropIdx(idx) }}
                      onDrop={() => handleDrop(idx)}
                      onDragEnd={() => { setDragIdx(null); setDropIdx(null) }}
                      className="relative aspect-square rounded-[10px] overflow-hidden group cursor-grab border-2 transition-colors"
                      style={{
                        borderColor: dropIdx === idx && dragIdx !== idx ? '#FF6B35' : 'transparent',
                        opacity: dragIdx === idx ? 0.5 : 1,
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo.url} alt="" className="w-full h-full object-cover" />

                      {/* Primary star */}
                      {idx === 0 && (
                        <div className="absolute top-1 left-1 w-5 h-5 bg-orange rounded-full flex items-center justify-center shadow-sm">
                          <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                        </div>
                      )}

                      {/* Remove button */}
                      <button
                        onClick={e => { e.stopPropagation(); handleRemovePhoto(photo.id) }}
                        className="absolute top-1 right-1 w-5 h-5 bg-ink/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-ink"
                      >
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Video section */}
              <div className="mt-6">
                <label className={labelCls}>Video <span className="text-ink-3 font-normal">(optional)</span></label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={e => { setVideoUrl(e.target.value); setVideoError('') }}
                  className={inputCls}
                  placeholder="Paste a YouTube link here"
                />
                {videoError && <p className="text-xs text-red-500 mt-1.5">{videoError}</p>}
              </div>
            </div>
          )}

          {/* ─────── STEP 4: Review & Publish ─────── */}
          {step === 4 && (
            <div>
              <h2 className="font-sans font-bold text-[22px] text-ink mb-1 text-center" style={{ letterSpacing: '-0.02em' }}>
                Ready to publish?
              </h2>
              <p className="text-sm text-ink-2 mb-5 text-center">
                Here&apos;s how your listing will appear on the marketplace.
              </p>

              {/* Preview card — constrained width, centered */}
              <div style={{ maxWidth: '420px', margin: '0 auto' }}>
              <div className="border border-[#E8E9EA] rounded-[16px] overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                {/* Primary photo */}
                <div className="w-full h-[220px] bg-[#F0F0F0] relative">
                  {photos[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photos[0].url} alt={form.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-12 h-12 text-ink-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  {/* Photo count badge */}
                  {photos.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-ink/60 text-white text-xs font-mono px-2 py-0.5 rounded-pill">
                      {photos.length} photos
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-5">
                  {/* Category badge */}
                  <p className="font-mono text-[12px] uppercase tracking-[0.08em] text-ink-3 mb-2">{catLabel(form.category)}</p>

                  {/* Title + Price */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="font-sans font-bold text-base text-ink leading-snug" style={{ letterSpacing: '-0.01em' }}>
                      {form.title || 'Untitled Draft'}
                    </h3>
                    <div className="shrink-0 text-right">
                      {(() => {
                        const priceStr = formatPrice(parseFloat(form.price) || 0, form.price_unit, form.price_visible)
                        return priceStr === 'Contact for price'
                          ? <span className="text-sm font-sans text-ink-2 italic">Contact for price</span>
                          : <span className="font-mono font-bold text-base" style={{ color: '#FF6B35' }}>{priceStr}</span>
                      })()}
                    </div>
                  </div>

                  {/* Location + Condition */}
                  <div className="flex items-center gap-3 mb-3 text-sm text-ink-2">
                    {(form.location_city || form.location_state) && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-ink-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {[form.location_city, form.location_state].filter(Boolean).join(', ')}
                      </span>
                    )}
                    {form.condition && (
                      <span
                        className="px-2 py-0.5 text-xs font-mono font-bold rounded-pill border"
                        style={condPillStyle(form.condition)}
                      >
                        {condLabel(form.condition)}
                      </span>
                    )}
                  </div>

                  {/* Description excerpt */}
                  {form.description && (
                    <p className="text-sm text-ink-2 leading-relaxed line-clamp-3">{form.description}</p>
                  )}
                </div>
              </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Fixed footer ── */}
        <div className="shrink-0 border-t border-[#E8E9EA] px-8 py-4">
          {step === 4 ? (
            <div className="flex items-center gap-3">
              <button
                onClick={handleBack}
                disabled={stepLoading}
                className="px-5 py-2.5 text-sm font-bold text-ink-2 border border-[#D4D5D7] rounded-pill hover:border-ink hover:text-ink transition-colors disabled:opacity-40"
              >
                ← Back
              </button>
              <div className="flex-1 flex items-center justify-end gap-3">
                <button
                  onClick={handleSaveAsDraft}
                  disabled={stepLoading}
                  className="px-5 py-2.5 text-sm font-bold text-ink border border-[#D4D5D7] rounded-pill hover:border-ink transition-colors disabled:opacity-40"
                >
                  {stepLoading ? 'Saving…' : 'Save as Draft'}
                </button>
                <button
                  onClick={handlePublish}
                  disabled={stepLoading}
                  className="px-6 py-2.5 text-sm font-bold text-white bg-orange rounded-pill hover:bg-orange-lt transition-colors disabled:opacity-40"
                  style={{ boxShadow: '0 4px 16px rgba(255,107,53,0.30)' }}
                >
                  {stepLoading ? 'Publishing…' : 'Publish Listing'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              {step > 1 ? (
                <button
                  onClick={handleBack}
                  disabled={generating || stepLoading}
                  className="px-5 py-2.5 text-sm font-bold text-ink-2 border border-[#D4D5D7] rounded-pill hover:border-ink hover:text-ink transition-colors disabled:opacity-40"
                >
                  ← Back
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                {/* Save as Draft — available from step 2 onwards (B017) */}
                {step >= 2 && (
                  <button
                    onClick={handleSaveAsDraft}
                    disabled={stepLoading || !listingId}
                    className="px-4 py-2.5 text-sm font-bold text-ink border border-[#D4D5D7] rounded-pill hover:border-ink transition-colors disabled:opacity-40"
                  >
                    Save as Draft
                  </button>
                )}

                <button
                  onClick={handleNext}
                  disabled={nextDisabled}
                  className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-orange rounded-pill hover:bg-orange-lt transition-colors disabled:opacity-40"
                  style={{ boxShadow: nextDisabled ? 'none' : '0 4px 16px rgba(255,107,53,0.30)' }}
                >
                  {generating && (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  {nextLabel}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
