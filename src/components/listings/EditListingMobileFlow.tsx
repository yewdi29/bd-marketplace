'use client'

import { useEffect, useRef, useState } from 'react'
import ListingTaxonomyFields, {
  FormField,
  inputCls,
  selectCls,
  SelectWrapper,
  labelCls,
} from '@/components/listings/ListingTaxonomyFields'
import ListingMediaSection from './ListingMediaSection'
import type { EditForm, PhotoState } from './EditListingModal'
import type { ListingTaxonomyFormValues } from '@/hooks/useListingTaxonomy'
import type { GalleryItem } from '@/lib/listings/listingGallery'
import type { ListingVideoSlot } from '@/lib/listings/listingVideoUploadClient'
import {
  MAX_LISTING_PHOTOS,
} from '@/lib/listings/listingPhotoUpload'

const MAX_PHOTOS = MAX_LISTING_PHOTOS

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

function ChevronLeftIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function CameraIcon() {
  return (
    <svg className="w-8 h-8 text-ink-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
    </svg>
  )
}

function StepProgress({ step }: { step: 1 | 2 }) {
  return (
    <div className="flex items-center gap-1.5" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={2}>
      {[1, 2].map(i => {
        const completed = i < step
        const active = i === step
        return (
          <div
            key={i}
            className="h-1.5 rounded-pill transition-colors"
            style={{
              width: active ? '28px' : '20px',
              background: active ? '#FF6B35' : completed ? '#D4D5D7' : '#E8E9EA',
            }}
            aria-hidden
          />
        )
      })}
    </div>
  )
}

export interface EditListingMobileFlowProps {
  onClose: () => void
  listingId: string
  loading: boolean
  form: EditForm | null
  setForm: React.Dispatch<React.SetStateAction<EditForm | null>>
  taxonomy: ListingTaxonomyFormValues
  setTaxonomy: React.Dispatch<React.SetStateAction<ListingTaxonomyFormValues>>
  photos: PhotoState[]
  uploadingPhoto: boolean
  galleryItems: GalleryItem[]
  canAddPhoto: boolean
  canAddVideo: boolean
  activeVideoCount: number
  rejectedVideos: ListingVideoSlot[]
  videosLoading: boolean
  listingStatus: string
  error: string
  publishError: string
  priceError: string
  setPriceError: (v: string) => void
  saving: boolean
  publishing: boolean
  canPublish: boolean
  loadError: string
  handleFileSelect: (files: FileList) => Promise<void>
  handleDeletePhoto: (id: string) => Promise<void>
  onReorder: (items: GalleryItem[]) => void | Promise<void>
  onAddVideo: (file: File) => Promise<string | null>
  onRemoveVideo: (videoId: string) => Promise<string | null>
  onVideoError: (message: string) => void
  handleSaveDraft: () => Promise<void>
  handleSave: () => Promise<void>
  handlePublish: () => Promise<void>
}

export default function EditListingMobileFlow({
  onClose,
  listingId,
  loading,
  form,
  setForm,
  taxonomy,
  setTaxonomy,
  photos,
  uploadingPhoto,
  galleryItems,
  canAddPhoto,
  canAddVideo,
  activeVideoCount,
  rejectedVideos,
  videosLoading,
  listingStatus,
  error,
  publishError,
  priceError,
  setPriceError,
  saving,
  publishing,
  canPublish,
  loadError,
  handleFileSelect,
  handleDeletePhoto,
  onReorder,
  onAddVideo,
  onRemoveVideo,
  onVideoError,
  handleSaveDraft,
  handleSave,
  handlePublish,
}: EditListingMobileFlowProps) {
  const [entered, setEntered] = useState(false)
  const [exitConfirm, setExitConfirm] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)
  const [slideDir, setSlideDir] = useState<'forward' | 'back'>('forward')
  const [keyboardOffset, setKeyboardOffset] = useState(0)
  const prevStepRef = useRef(step)

  const isDraft = listingStatus === 'draft'

  useEffect(() => {
    requestAnimationFrame(() => setEntered(true))
  }, [])

  useEffect(() => {
    if (step > prevStepRef.current) setSlideDir('forward')
    else if (step < prevStepRef.current) setSlideDir('back')
    prevStepRef.current = step
  }, [step])

  useEffect(() => {
    const scrollY = window.scrollY
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'

    return () => {
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      window.scrollTo(0, scrollY)
    }
  }, [])

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    function updateKeyboardInset() {
      if (!vv) return
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
      setKeyboardOffset(inset)
    }

    updateKeyboardInset()
    vv.addEventListener('resize', updateKeyboardInset)
    vv.addEventListener('scroll', updateKeyboardInset)
    return () => {
      vv.removeEventListener('resize', updateKeyboardInset)
      vv.removeEventListener('scroll', updateKeyboardInset)
    }
  }, [])

  function requestExit() {
    setExitConfirm(true)
  }

  function handleHeaderBack() {
    setSlideDir('back')
    setStep(1)
  }

  function handleNextStep() {
    setSlideDir('forward')
    setStep(2)
  }

  const slideClass = slideDir === 'forward' ? 'nl-step-forward' : 'nl-step-back'
  const busy = saving || publishing

  return (
    <div
      className={`fixed inset-0 z-[130] bg-white flex flex-col transition-transform duration-300 ease-out ${entered ? 'translate-y-0' : 'translate-y-full'}`}
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <header className="shrink-0 flex items-center justify-between gap-3 px-4 py-3 border-b border-[#E8E9EA] bg-white">
        {step === 1 ? (
          <div className="w-10 h-10 shrink-0" aria-hidden />
        ) : (
          <button
            type="button"
            onClick={handleHeaderBack}
            aria-label="Previous step"
            className="w-10 h-10 flex items-center justify-center rounded-full text-ink hover:bg-bg transition-colors shrink-0"
          >
            <ChevronLeftIcon />
          </button>
        )}

        <StepProgress step={step} />

        <button
          type="button"
          onClick={requestExit}
          aria-label="Close edit listing"
          className="w-10 h-10 flex items-center justify-center rounded-full text-ink hover:bg-bg transition-colors shrink-0"
        >
          <CloseIcon />
        </button>
      </header>

      {exitConfirm && (
        <div className="shrink-0 px-4 py-4 border-b border-[#E8E9EA] bg-bg">
          <p className="text-sm font-sans font-semibold text-ink mb-1">
            Discard changes?
          </p>
          <p className="text-sm text-ink-2 mb-4">
            Any unsaved edits will be lost.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setExitConfirm(false)}
              className="flex-1 py-2.5 text-sm font-bold text-ink border border-[#D4D5D7] rounded-pill hover:border-ink transition-colors"
            >
              Keep Editing
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-bold text-white bg-ink rounded-pill hover:bg-ink/90 transition-colors"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {(error || publishError) && !exitConfirm && (
        <div className="shrink-0 mx-4 mt-4 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-sans text-red-600">{error || publishError}</p>
        </div>
      )}

      <div className="relative flex-1 min-h-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <svg className="w-6 h-6 animate-spin text-ink-3" fill="none" viewBox="0 0 24 24" aria-hidden>
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : !form ? (
          <div className="flex items-center justify-center h-full px-5">
            <p className="text-sm text-red-500 text-center">{loadError || 'Failed to load listing.'}</p>
          </div>
        ) : (
          <div
            key={step}
            className={`absolute inset-0 overflow-y-auto overscroll-contain nl-step-panel ${slideClass}`}
            style={{ paddingBottom: `calc(88px + env(safe-area-inset-bottom) + ${keyboardOffset}px)` }}
          >
            {step === 1 && (
              <div className="px-5 pt-6 pb-4 space-y-4">
                <p className="text-xs font-mono text-ink-3 uppercase tracking-wide mb-1">
                  {isDraft ? 'Draft Listing' : 'Edit Listing'}
                </p>
                <h1 className="font-sans font-bold text-[26px] text-ink leading-tight mb-2" style={{ letterSpacing: '-0.02em' }}>
                  {isDraft ? 'Edit draft details' : 'Update details'}
                </h1>
                <p className="text-[15px] text-ink-2 leading-relaxed mb-2">
                  Review and update your listing information.
                </p>

                <FormField label="Title" required>
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => setForm(f => f ? { ...f, title: e.target.value } : f)}
                    className={inputCls}
                    placeholder="Equipment title"
                  />
                </FormField>

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

                <ListingTaxonomyFields values={taxonomy} onChange={setTaxonomy} required />

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

                <FormField label="Price (USD)" required>
                  <div className="flex flex-col gap-2 sm:flex-row">
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
                        className={selectCls}
                      >
                        {PRICE_UNITS.map(u => (
                          <option key={u.value} value={u.value}>{u.label}</option>
                        ))}
                      </select>
                    </SelectWrapper>
                  </div>
                  {priceError && (
                    <p className="text-orange font-sans text-xs mt-1">{priceError}</p>
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

                <FormField label="Description">
                  <textarea
                    value={form.description}
                    onChange={e => setForm(f => f ? { ...f, description: e.target.value } : f)}
                    className={`${inputCls} resize-none leading-relaxed`}
                    style={{ minHeight: '200px' }}
                    placeholder="Detailed equipment description for buyers…"
                  />
                </FormField>
              </div>
            )}

            {step === 2 && (
              <div className="px-5 pt-6 pb-4">
                <p className="text-xs font-mono text-ink-3 uppercase tracking-wide mb-1">
                  {isDraft ? 'Draft Listing' : 'Edit Listing'}
                </p>
                <h1 className="font-sans font-bold text-[26px] text-ink leading-tight mb-5" style={{ letterSpacing: '-0.02em' }}>
                  Media
                </h1>

                <ListingMediaSection
                  listingId={listingId}
                  photos={photos}
                  galleryItems={galleryItems}
                  uploadingPhoto={uploadingPhoto}
                  canAddPhoto={canAddPhoto}
                  canAddVideo={canAddVideo}
                  activeVideoCount={activeVideoCount}
                  rejectedVideos={rejectedVideos}
                  videosLoading={videosLoading}
                  layout="horizontal"
                  onReorder={onReorder}
                  onFileSelect={handleFileSelect}
                  onAddVideo={onAddVideo}
                  onRemovePhoto={(id) => { void handleDeletePhoto(id) }}
                  onRemoveVideo={onRemoveVideo}
                  onError={onVideoError}
                  required
                />
              </div>
            )}
          </div>
        )}
      </div>

      {!exitConfirm && !loading && form && step === 1 && (
        <div
          className="shrink-0 border-t border-[#E8E9EA] bg-white px-5 py-4"
          style={{ paddingBottom: `max(16px, calc(env(safe-area-inset-bottom) + ${keyboardOffset}px))` }}
        >
          <button
            type="button"
            onClick={handleNextStep}
            className="w-full py-3.5 text-sm font-bold text-white bg-orange rounded-pill hover:bg-orange-lt transition-colors"
            style={{ boxShadow: '0 4px 16px rgba(255,107,53,0.30)' }}
          >
            Next →
          </button>
        </div>
      )}

      {!exitConfirm && !loading && form && step === 2 && (
        <div
          className="shrink-0 border-t border-[#E8E9EA] bg-white px-5 py-4"
          style={{ paddingBottom: `max(16px, calc(env(safe-area-inset-bottom) + ${keyboardOffset}px))` }}
        >
          {isDraft ? (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => void handleSaveDraft()}
                disabled={busy}
                className="flex-1 py-3.5 text-sm font-bold text-ink-2 border border-[#D4D5D7] rounded-pill hover:border-ink hover:text-ink transition-colors disabled:opacity-40"
              >
                {saving ? 'Saving…' : 'Save Draft'}
              </button>
              <button
                type="button"
                onClick={() => void handlePublish()}
                disabled={!canPublish || busy}
                className="flex-1 py-3.5 text-sm font-bold text-white bg-orange rounded-pill hover:bg-orange-lt transition-colors disabled:opacity-40"
                style={{ boxShadow: canPublish && !busy ? '0 4px 16px rgba(255,107,53,0.30)' : 'none' }}
              >
                {publishing ? 'Publishing…' : 'Publish Listing'}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={busy}
              className="w-full py-3.5 text-sm font-bold text-white bg-orange rounded-pill hover:bg-orange-lt transition-colors disabled:opacity-40"
              style={{ boxShadow: busy ? 'none' : '0 4px 16px rgba(255,107,53,0.30)' }}
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
