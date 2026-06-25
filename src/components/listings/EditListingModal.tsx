'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import ListingTaxonomyFields, { FormField, inputCls, selectCls, SelectWrapper, labelCls } from '@/components/listings/ListingTaxonomyFields'
import ListingPhotoSortableList from '@/components/listings/ListingPhotoSortableList'
import EditListingMobileFlow from '@/components/listings/EditListingMobileFlow'
import { useIsBelowLg } from '@/hooks/useIsBelowLg'
import {
  EMPTY_TAXONOMY_VALUES,
  useListingTaxonomy,
  type ListingTaxonomyFormValues,
} from '@/hooks/useListingTaxonomy'

// ─── Constants ────────────────────────────────────────────────────────────────

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

const MAX_PHOTOS = 20

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PhotoState {
  id: string
  url: string
}

export interface EditForm {
  title: string
  category: string
  manufacturer: string
  model: string
  year: string
  condition: string
  price: string
  price_unit: string
  price_visible: boolean
  description: string
}

interface Props {
  listingId: string
  onClose: () => void
  onSaved: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function EditListingModal({ listingId, onClose, onSaved }: Props) {
  const supabase = createClient()
  const taxonomyData = useListingTaxonomy()
  const isMobileFlow = useIsBelowLg()
  const [form, setForm] = useState<EditForm | null>(null)
  const [taxonomy, setTaxonomy] = useState<ListingTaxonomyFormValues>(EMPTY_TAXONOMY_VALUES)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [listingStatus, setListingStatus] = useState('')
  const [error, setError] = useState('')
  const [publishError, setPublishError] = useState('')

  // Price error
  const [priceError, setPriceError] = useState('')

  // Photo state
  const [photos, setPhotos] = useState<PhotoState[]>([])
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch listing data + existing images on mount
  useEffect(() => {
    async function fetchListing() {
      const { data, error: fetchError } = await supabase
        .from('listings')
        .select('title, category, manufacturer, model, year, condition, price, price_unit, price_visible, location_city, location_state, description, status, country_id, region_id, state_id, industry_id, category_id, listing_images(id, url, sort_order, is_primary)')
        .eq('id', listingId)
        .single()

      if (fetchError || !data) {
        setError('Could not load listing data.')
        setLoading(false)
        return
      }

      setForm({
        title: data.title ?? '',
        category: data.category ?? '',
        manufacturer: data.manufacturer ?? '',
        model: data.model ?? '',
        year: data.year != null ? String(data.year) : '',
        condition: data.condition ?? '',
        price: data.price != null && data.price > 0 ? String(data.price) : '',
        price_unit: (data as { price_unit?: string }).price_unit ?? 'total',
        price_visible: data.price_visible !== false,
        description: data.description ?? '',
      })
      setTaxonomy({
        country_id: data.country_id ?? '',
        region_id: data.region_id ?? '',
        state_id: data.state_id ?? '',
        industry_id: data.industry_id ?? '',
        category_id: data.category_id ?? '',
        location_city: data.location_city ?? '',
        location_state: data.location_state ?? '',
      })

      // Sort images: primary first, then by sort_order
      const imgs = ((data.listing_images ?? []) as { id: string; url: string; sort_order: number; is_primary: boolean }[])
        .sort((a, b) => {
          if (a.is_primary && !b.is_primary) return -1
          if (!a.is_primary && b.is_primary) return 1
          return a.sort_order - b.sort_order
        })
      setPhotos(imgs.map(i => ({ id: i.id, url: i.url })))
      setListingStatus(data.status ?? '')
      setLoading(false)
    }
    fetchListing()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId])

  // ── Photo handlers ──────────────────────────────────────────────────────────

  async function handleFileSelect(files: FileList) {
    const remaining = MAX_PHOTOS - photos.length
    const toUpload = Array.from(files).slice(0, remaining)
    if (toUpload.length === 0) return

    setUploadingPhoto(true)
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
        // Continue with remaining files
      }
    }
    setUploadingPhoto(false)
  }

  async function handleDeletePhoto(imageId: string) {
    const index = photos.findIndex(p => p.id === imageId)
    const removed = photos[index]
    if (index === -1 || !removed) return

    setPhotos(prev => prev.filter(p => p.id !== imageId))

    try {
      const res = await fetch(`/api/listings/${listingId}/images/${imageId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
    } catch {
      setPhotos(prev => {
        const next = [...prev]
        next.splice(index, 0, removed)
        return next
      })
      setError('Could not remove photo. Please try again.')
    }
  }

  // ── Shared patch helper ────────────────────────────────────────────────────

  async function patchListingFields(): Promise<{ ok: boolean; errorMsg?: string }> {
    if (!form) return { ok: false, errorMsg: 'No form data.' }

    const requests: Promise<Response>[] = [
      fetch(`/api/listings/${listingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          category: form.category,
          manufacturer: form.manufacturer || null,
          model: form.model || null,
          year: form.year ? parseInt(form.year) : null,
          condition: form.condition,
          price: parseFloat(form.price) || 0,
          price_unit: form.price_unit,
          price_visible: form.price_visible,
          description: form.description || null,
          ...taxonomy,
        }),
      }),
    ]

    if (photos.length > 0) {
      requests.push(
        fetch(`/api/listings/${listingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_order: photos.map(p => p.id) }),
        })
      )
    }

    const results = await Promise.all(requests)
    const failed = results.find(r => !r.ok)
    if (failed) {
      const d = await failed.json() as { error?: string }
      return { ok: false, errorMsg: d.error ?? 'Save failed. Please try again.' }
    }
    return { ok: true }
  }

  // ── Save draft (no price required) ─────────────────────────────────────────

  async function handleSaveDraft() {
    if (!form) return
    setSaving(true)
    setError('')
    try {
      const { ok, errorMsg } = await patchListingFields()
      if (!ok) { setError(errorMsg ?? 'Save failed.'); return }
      onSaved()
      onClose()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // ── Save changes (active listing — price required) ─────────────────────────

  async function handleSave() {
    if (!form) return

    if (!form.price || parseFloat(form.price) <= 0) {
      setPriceError('Price is required to publish your listing.')
      return
    }
    setPriceError('')

    setSaving(true)
    setError('')
    try {
      const { ok, errorMsg } = await patchListingFields()
      if (!ok) { setError(errorMsg ?? 'Save failed.'); return }
      onSaved()
      onClose()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // ── Publish draft ──────────────────────────────────────────────────────────

  async function handlePublish() {
    if (!form) return
    setPublishing(true)
    setError('')
    setPublishError('')
    try {
      const { ok, errorMsg } = await patchListingFields()
      if (!ok) { setError(errorMsg ?? 'Save failed.'); return }

      const res = await fetch(`/api/listings/${listingId}/publish`, { method: 'PATCH' })
      if (!res.ok) {
        const d = await res.json() as { error?: string }
        setPublishError('Listing is missing required fields. Complete all fields marked with an asterisk (*) before publishing.')
        return
      }

      onSaved()
      onClose()
    } catch {
      setPublishError('Network error. Please try again.')
    } finally {
      setPublishing(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const countrySlug = taxonomyData.getCountrySlug(taxonomy.country_id)
  const hasLocation = !!(
    taxonomy.country_id &&
    (countrySlug === 'mexico' || (taxonomy.location_city && taxonomy.state_id))
  )

  const canPublish = !!(
    form &&
    form.title && form.title !== 'Untitled Draft' &&
    taxonomy.industry_id && taxonomy.category_id &&
    parseFloat(form.price) > 0 &&
    form.condition &&
    hasLocation &&
    photos.length >= 1
  )

  if (isMobileFlow) {
    return (
      <EditListingMobileFlow
        onClose={onClose}
        loading={loading}
        form={form}
        setForm={setForm}
        taxonomy={taxonomy}
        setTaxonomy={setTaxonomy}
        photos={photos}
        uploadingPhoto={uploadingPhoto}
        listingStatus={listingStatus}
        error={error}
        publishError={publishError}
        priceError={priceError}
        setPriceError={setPriceError}
        saving={saving}
        publishing={publishing}
        canPublish={canPublish}
        loadError={error}
        fileInputRef={fileInputRef}
        handleFileSelect={handleFileSelect}
        handleDeletePhoto={handleDeletePhoto}
        onPhotoReorder={setPhotos}
        handleSaveDraft={handleSaveDraft}
        handleSave={handleSave}
        handlePublish={handlePublish}
      />
    )
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full bg-white flex flex-col"
        style={{ maxWidth: '680px', borderRadius: '20px', maxHeight: '90vh', boxShadow: '0 32px 80px rgba(0,0,0,0.20)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 px-8 pt-6 pb-4 border-b border-[#E8E9EA] flex items-center justify-between">
          <div>
            <p className="text-xs font-mono text-ink-3 uppercase tracking-wide mb-0.5">
              {listingStatus === 'draft' ? 'Draft Listing' : 'Edit Listing'}
            </p>
            <h2 className="font-sans font-bold text-lg text-ink" style={{ letterSpacing: '-0.02em' }}>
              {listingStatus === 'draft' ? 'Edit Draft' : 'Update details'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-bg text-ink-3 hover:text-ink transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <svg className="w-6 h-6 animate-spin text-ink-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : !form ? (
            <p className="text-sm text-red-500">{error || 'Failed to load listing.'}</p>
          ) : (
            <div className="space-y-5">
              {error && (
                <div className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-sm font-sans text-red-600">{error}</p>
                </div>
              )}

              {/* ── Photos section — first so seller sees media immediately ── */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={labelCls}>
                    Photos<span className="ml-0.5 text-[#CC0000]">*</span>
                  </label>
                  <span className="text-xs font-mono text-ink-3">{photos.length} / {MAX_PHOTOS} photos</span>
                </div>

                {/* Existing + new thumbnail grid */}
                {photos.length > 0 && (
                  <div className="mb-3">
                    <ListingPhotoSortableList
                      photos={photos}
                      onReorder={setPhotos}
                      onRemove={id => { void handleDeletePhoto(id) }}
                      layout="grid"
                    />
                  </div>
                )}

                {/* Upload zone */}
                {photos.length < MAX_PHOTOS && (
                  <div
                    className="border-2 border-dashed border-[#D4D5D7] rounded-[14px] flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-orange hover:bg-orange/[0.02] transition-colors"
                    style={{ minHeight: photos.length === 0 ? '140px' : '72px', padding: '16px' }}
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
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span className="text-sm font-sans">Uploading…</span>
                      </div>
                    ) : (
                      <>
                        <svg className="w-6 h-6 text-ink-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm font-sans text-ink-2 text-center">
                          <span className="font-semibold text-orange">Click to browse</span> or drag &amp; drop
                        </p>
                        {photos.length === 0 && (
                          <p className="text-xs text-ink-3">PNG, JPG — up to {MAX_PHOTOS} photos</p>
                        )}
                      </>
                    )}
                  </div>
                )}

                {photos.length > 0 && (
                  <p className="text-xs text-ink-3 mt-1.5">Drag the grip to reorder — first photo is the cover image</p>
                )}
              </div>

              {/* Title */}
              <FormField label="Title" required>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => f ? { ...f, title: e.target.value } : f)}
                  className={inputCls}
                  placeholder="Equipment title"
                />
              </FormField>

              {/* Condition */}
              <FormField label="Condition" required>
                <SelectWrapper>
                  <select
                    value={form.condition}
                    onChange={e => setForm(f => f ? { ...f, condition: e.target.value } : f)}
                    className={selectCls}
                  >
                    <option value="">Select condition</option>
                    {CONDITIONS.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </SelectWrapper>
              </FormField>

              {/* Industry, Category, Country, Region/State */}
              <ListingTaxonomyFields
                values={taxonomy}
                onChange={setTaxonomy}
                required
              />

              {/* Manufacturer + Model */}
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Manufacturer">
                  <input
                    type="text"
                    value={form.manufacturer}
                    onChange={e => setForm(f => f ? { ...f, manufacturer: e.target.value } : f)}
                    className={inputCls}
                    placeholder="e.g. National, Cameron"
                  />
                </FormField>
                <FormField label="Model">
                  <input
                    type="text"
                    value={form.model}
                    onChange={e => setForm(f => f ? { ...f, model: e.target.value } : f)}
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
                  onChange={e => setForm(f => f ? { ...f, year: e.target.value } : f)}
                  className={`${inputCls} font-mono`}
                  placeholder="e.g. 2018"
                  min={1900}
                  max={new Date().getFullYear() + 1}
                />
              </FormField>

              {/* Price + unit */}
              <FormField label="Price (USD)" required>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3 text-sm font-sans pointer-events-none">$</span>
                    <input
                      type="number"
                      value={form.price}
                      onChange={e => {
                        setForm(f => f ? { ...f, price: e.target.value } : f)
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
                      onChange={e => setForm(f => f ? { ...f, price_unit: e.target.value } : f)}
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
                <label className="flex items-center gap-3 cursor-pointer select-none mt-2.5">
                  <button
                    type="button"
                    onClick={() => setForm(f => f ? { ...f, price_visible: !f.price_visible } : f)}
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

              {/* Description */}
              <FormField label="Description">
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => f ? { ...f, description: e.target.value } : f)}
                  className={`${inputCls} resize-none leading-relaxed`}
                  style={{ minHeight: '120px' }}
                  placeholder="Detailed equipment description for buyers…"
                />
              </FormField>
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && form && (
          <div className="shrink-0 border-t border-[#E8E9EA] px-8 py-4 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={saving || publishing}
              className="px-5 py-2.5 text-sm font-bold text-ink-2 border border-[#D4D5D7] rounded-pill hover:border-ink hover:text-ink transition-colors disabled:opacity-40"
            >
              Cancel
            </button>

            {listingStatus === 'draft' ? (
              <>
                <button
                  onClick={handleSaveDraft}
                  disabled={saving || publishing}
                  className="px-5 py-2.5 text-sm font-bold text-ink-2 border border-[#D4D5D7] rounded-pill hover:border-ink hover:text-ink transition-colors disabled:opacity-40"
                >
                  {saving ? 'Saving…' : 'Save Draft'}
                </button>
                <div className="relative">
                  {/* Publish error pop-up — appears above the button */}
                  {publishError && (
                    <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 z-10 w-64">
                      <div className="relative bg-white border border-[#FFCCCC] rounded-[10px] px-3 py-2.5 shadow-lg text-center">
                        <p className="text-xs font-sans leading-relaxed" style={{ color: '#CC0000' }}>
                          {publishError}
                        </p>
                        {/* Downward caret */}
                        <div
                          className="absolute left-1/2 bg-white"
                          style={{
                            width: '10px',
                            height: '10px',
                            bottom: '-6px',
                            transform: 'translateX(-50%) rotate(45deg)',
                            borderRight: '1px solid #FFCCCC',
                            borderBottom: '1px solid #FFCCCC',
                          }}
                        />
                      </div>
                    </div>
                  )}
                  <button
                    onClick={handlePublish}
                    disabled={!canPublish || saving || publishing}
                    title={!canPublish ? 'Add a title, category, price, location, and at least one photo to publish' : undefined}
                    className="px-6 py-2.5 text-sm font-bold text-white bg-orange rounded-pill hover:bg-orange-lt transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ boxShadow: canPublish ? '0 4px 16px rgba(255,107,53,0.30)' : 'none' }}
                  >
                    {publishing ? 'Publishing…' : 'Publish Listing'}
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 text-sm font-bold text-white bg-orange rounded-pill hover:bg-orange-lt transition-colors disabled:opacity-40"
                style={{ boxShadow: '0 4px 16px rgba(255,107,53,0.30)' }}
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
