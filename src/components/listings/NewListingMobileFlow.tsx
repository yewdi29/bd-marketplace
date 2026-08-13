'use client'

import { useEffect, useRef, useState } from 'react'
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import ListingCardPreview from '@/components/listings/ListingCardPreview'
import ListingTaxonomyFields, { FormField, inputCls, selectCls, SelectWrapper } from '@/components/listings/ListingTaxonomyFields'
import { useListingTaxonomy } from '@/hooks/useListingTaxonomy'
import type { ListingTaxonomyFormValues } from '@/hooks/useListingTaxonomy'
import { createClient } from '@/lib/supabase/client'
import type { MembershipPlan } from '@/lib/types/database'
import {
  MAX_LISTING_PHOTOS,
} from '@/lib/listings/listingPhotoUpload'
import {
  getAccountListingLimit,
  hasUnlimitedListings,
} from '@/lib/planLimits'
import ListingMediaSection from './ListingMediaSection'
import ListingDescriptionVoiceField from '@/components/listings/ListingDescriptionVoiceField'
import DozerAsciiLoader from '@/components/listings/DozerAsciiLoader'
import type { ListingForm, PhotoState } from './NewListingModal'
import type { GalleryItem } from '@/lib/listings/listingGallery'
import type { ListingVideoSlot } from '@/lib/listings/listingVideoUploadClient'

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

function planLabel(plan: MembershipPlan): string {
  switch (plan) {
    case 'starter': return 'Starter'
    case 'pro': return 'Pro'
    case 'max': return 'Max'
    case 'premium': return 'Premium'
    default: return 'Free'
  }
}

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

function StepProgress({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-1.5" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={4}>
      {[1, 2, 3, 4].map(i => {
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

export interface NewListingMobileFlowProps {
  onClose: () => void
  listingId: string | null
  step: 1 | 2 | 3 | 4
  setStep: (step: 1 | 2 | 3 | 4) => void
  prompt: string
  setPrompt: (v: string) => void
  generating: boolean
  generateProgress: number
  stepLoading: boolean
  error: string
  upgradePrompt: boolean
  form: ListingForm
  setForm: React.Dispatch<React.SetStateAction<ListingForm>>
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
  onReorder: (items: GalleryItem[]) => void | Promise<void>
  onAddVideo: (file: File) => Promise<string | null>
  onRemoveVideo: (videoId: string) => Promise<string | null>
  onVideoError: (message: string) => void
  priceError: string
  setPriceError: (v: string) => void
  promptContainerRef: React.RefObject<HTMLDivElement>
  promptCanvasRef: React.RefObject<HTMLCanvasElement>
  promptFocused: boolean
  onPromptFocus: () => void
  onPromptBlur: () => void
  handleGenerate: () => Promise<void>
  handleSaveFields: () => Promise<void>
  handleSavePhotos: () => Promise<void>
  handlePublish: () => Promise<void>
  handleSaveAsDraft: () => Promise<void>
  handleDiscard: () => Promise<void>
  handleRemovePhoto: (id: string) => Promise<void>
  handleFileSelect: (files: FileList) => Promise<void>
  router: AppRouterInstance
}

export default function NewListingMobileFlow({
  onClose,
  listingId,
  step,
  setStep,
  prompt,
  setPrompt,
  generating,
  generateProgress,
  stepLoading,
  error,
  upgradePrompt,
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
  onReorder,
  onAddVideo,
  onRemoveVideo,
  onVideoError,
  priceError,
  setPriceError,
  promptContainerRef,
  promptCanvasRef,
  promptFocused,
  onPromptFocus,
  onPromptBlur,
  handleGenerate,
  handleSaveFields,
  handleSavePhotos,
  handlePublish,
  handleSaveAsDraft,
  handleDiscard,
  handleRemovePhoto,
  handleFileSelect,
  router,
}: NewListingMobileFlowProps) {
  const [entered, setEntered] = useState(false)
  const [exitConfirm, setExitConfirm] = useState(false)
  const [slideDir, setSlideDir] = useState<'forward' | 'back'>('forward')
  const [membership, setMembership] = useState<{
    plan: MembershipPlan
    activeCount: number
    isEnterpriseMember: boolean
  } | null>(null)
  const [keyboardOffset, setKeyboardOffset] = useState(0)

  const taxonomyData = useListingTaxonomy()
  const prevStepRef = useRef(step)

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

  useEffect(() => {
    if (step !== 4) return
    const supabase = createClient()
    async function loadMembership() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [{ data: profile }, { count }, orgMemberRes] = await Promise.all([
        supabase.from('users').select('plan').eq('id', user.id).single(),
        supabase.from('listings').select('id', { count: 'exact', head: true }).eq('seller_id', user.id).eq('status', 'active'),
        supabase
          .from('org_members')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle(),
      ])
      setMembership({
        plan: (profile?.plan as MembershipPlan) ?? 'free',
        activeCount: count ?? 0,
        isEnterpriseMember: Boolean(orgMemberRes.data),
      })
    }
    loadMembership()
  }, [step])

  function requestExit() {
    if (step === 1 && !prompt.trim()) {
      handleDiscard()
      return
    }
    setExitConfirm(true)
  }

  function handleHeaderBack() {
    setSlideDir('back')
    setStep((step - 1) as 1 | 2 | 3 | 4)
  }

  function handleNextStep() {
    setSlideDir('forward')
    if (step === 1) handleGenerate()
    else if (step === 2) handleSaveFields()
    else if (step === 3) handleSavePhotos()
  }

  const nextDisabled =
    (step === 1 && (generating || prompt.trim().length < 10)) ||
    stepLoading

  const nextLabel =
    step === 1 ? (generating ? 'Generating…' : 'Generate Listing →')
    : stepLoading ? 'Saving…'
    : 'Next →'

  const categorySlug = taxonomyData.categories.find(c => c.id === taxonomy.category_id)?.slug
    ?? form.category
    ?? 'other'

  const previewCountry = taxonomyData.countries.find(c => c.id === taxonomy.country_id)

  const limit = membership
    ? getAccountListingLimit(membership.plan, membership.isEnterpriseMember)
    : null
  const unlimited = membership
    ? hasUnlimitedListings(membership.plan, membership.isEnterpriseMember)
    : false
  const membershipLine = membership && limit !== null
    ? unlimited
      ? `${membership.isEnterpriseMember ? 'Enterprise' : planLabel(membership.plan)} plan · Unlimited listings`
      : `${planLabel(membership.plan)} plan · ${Math.max(0, limit - membership.activeCount)} of ${limit} listings remaining`
    : null

  const slideClass = slideDir === 'forward' ? 'nl-step-forward' : 'nl-step-back'

  return (
    <div
      className={`fixed inset-0 z-[130] bg-white flex flex-col transition-transform duration-300 ease-out ${entered ? 'translate-y-0' : 'translate-y-full'}`}
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      {/* Fixed header */}
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
          aria-label="Close new listing flow"
          className="w-10 h-10 flex items-center justify-center rounded-full text-ink hover:bg-bg transition-colors shrink-0"
        >
          <CloseIcon />
        </button>
      </header>

      {/* Inline exit confirmation */}
      {exitConfirm && (
        <div className="shrink-0 px-4 py-4 border-b border-[#E8E9EA] bg-bg">
          <p className="text-sm font-sans font-semibold text-ink mb-1">
            Are you sure you want to exit?
          </p>
          <p className="text-sm text-ink-2 mb-4">
            Your progress will be lost.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setExitConfirm(false)}
              className="flex-1 py-2.5 text-sm font-bold text-ink border border-[#D4D5D7] rounded-pill hover:border-ink transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDiscard}
              className="flex-1 py-2.5 text-sm font-bold text-white bg-ink rounded-pill hover:bg-ink/90 transition-colors"
            >
              Exit
            </button>
          </div>
        </div>
      )}

      {/* Error banner */}
      {error && !exitConfirm && (
        <div className="shrink-0 mx-4 mt-4 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3">
          {upgradePrompt ? (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-sans text-red-600">{error}</p>
              <button
                type="button"
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

      {/* Step content — horizontal slide transition */}
      <div className="relative flex-1 min-h-0 overflow-hidden">
        <div
          key={step}
          className={`absolute inset-0 overflow-y-auto overscroll-contain nl-step-panel ${slideClass}`}
          style={{
            paddingBottom: step === 4
              ? 'calc(140px + env(safe-area-inset-bottom))'
              : 'calc(88px + env(safe-area-inset-bottom))',
          }}
        >
          {step === 1 && (
            <div className="flex flex-col min-h-full px-5 pt-6 pb-4">
              {generating ? (
                <>
                  <h1 className="font-sans font-bold text-[26px] text-ink leading-tight mb-2" style={{ letterSpacing: '-0.02em' }}>
                    Building your listing.
                  </h1>
                  <p className="text-[15px] text-ink-2 leading-relaxed mb-4">
                    Our AI is extracting details from your description.
                  </p>
                  <div
                    className="relative flex-1 flex flex-col min-h-[280px] rounded-[10px] border border-[#E8E9EA] overflow-hidden"
                  >
                    <DozerAsciiLoader progress={generateProgress} className="flex-1" />
                  </div>
                </>
              ) : (
                <>
                  <h1 className="font-sans font-bold text-[26px] text-ink leading-tight mb-2" style={{ letterSpacing: '-0.02em' }}>
                    Describe your equipment.
                  </h1>
                  <p className="text-[15px] text-ink-2 leading-relaxed mb-5">
                    Just talk to us like you would a buyer. Our AI will extract all the details and build your listing.
                  </p>

                  <ListingDescriptionVoiceField
                    value={prompt}
                    onChange={setPrompt}
                    interactionMode="hold"
                    onFocus={onPromptFocus}
                    onBlur={onPromptBlur}
                    placeholder="Describe your equipment in your own words — what it is, condition, specs, price, and location."
                    className="flex-1 resize-none leading-relaxed min-h-[220px] focus:outline-none focus:ring-0"
                    style={{
                      display: 'block',
                      borderColor: promptFocused ? 'transparent' : '#E8E9EA',
                      transition: 'border-color 0.15s',
                    }}
                    glowContainerRef={promptContainerRef}
                    glowContainerClassName="flex-1 flex flex-col min-h-[200px]"
                    glowUnderlay={
                      <canvas
                        ref={promptCanvasRef}
                        style={{ position: 'absolute', zIndex: 0, pointerEvents: 'none' }}
                      />
                    }
                  />
                </>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="px-5 pt-6 pb-4 space-y-4">
              <div>
                <h1 className="font-sans font-bold text-[26px] text-ink leading-tight mb-2" style={{ letterSpacing: '-0.02em' }}>
                  Review your listing.
                </h1>
                <p className="text-[15px] text-ink-2 leading-relaxed">
                  Our AI generated this from your description. Edit anything before moving on.
                </p>
              </div>

              <FormField label="Title">
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className={inputCls}
                  placeholder="e.g. 2018 National 12P-160 Drilling Rig"
                />
              </FormField>

              <FormField label="Price (USD)">
                <div className="flex flex-col gap-2 sm:flex-row">
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

              <ListingTaxonomyFields values={taxonomy} onChange={setTaxonomy} />

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

          {step === 3 && (
            <div className="px-5 pt-6 pb-4">
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
                onRemovePhoto={(id) => { void handleRemovePhoto(id) }}
                onRemoveVideo={onRemoveVideo}
                onError={onVideoError}
              />
            </div>
          )}

          {step === 4 && (
            <div className="px-5 pt-6 pb-4">
              <h1 className="font-sans font-bold text-[26px] text-ink leading-tight mb-5 text-center" style={{ letterSpacing: '-0.02em' }}>
                Ready to publish?
              </h1>

              <ListingCardPreview
                listing={{
                  id: 'preview',
                  slug: null,
                  title: form.title || 'Untitled Draft',
                  category: categorySlug,
                  price: parseFloat(form.price) || 0,
                  price_unit: form.price_unit,
                  price_visible: form.price_visible,
                  location_city: taxonomy.location_city || null,
                  location_state: taxonomy.location_state || null,
                  created_at: '1970-01-01T00:00:00.000Z',
                  listing_images: photos.map((p, i) => ({
                    url: p.url,
                    is_primary: i === 0,
                    alt_text: form.title || null,
                  })),
                  countries: previewCountry
                    ? { name: previewCountry.name, iso_code: previewCountry.iso_code }
                    : null,
                }}
              />

              {membershipLine && (
                <p className="text-center text-sm text-ink-2 mt-5 font-sans">
                  {membershipLine}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Step 1: Save as Draft + Generate */}
      {!exitConfirm && step === 1 && (
        <div
          className="shrink-0 border-t border-[#E8E9EA] bg-white px-5 py-4"
          style={{ paddingBottom: `max(16px, calc(env(safe-area-inset-bottom) + ${keyboardOffset}px))` }}
        >
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSaveAsDraft}
              disabled={stepLoading || !prompt.trim()}
              className="flex-1 py-3.5 text-sm font-bold text-ink-2 border border-[#D4D5D7] rounded-pill hover:border-ink hover:text-ink transition-colors disabled:opacity-40"
            >
              {stepLoading ? 'Saving…' : 'Save as Draft'}
            </button>
            <button
              type="button"
              onClick={handleNextStep}
              disabled={nextDisabled}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-bold text-white bg-orange rounded-pill hover:bg-orange-lt transition-colors disabled:opacity-40"
              style={{ boxShadow: nextDisabled ? 'none' : '0 4px 16px rgba(255,107,53,0.30)' }}
            >
              {generating && (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden>
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {nextLabel}
            </button>
          </div>
        </div>
      )}

      {/* Steps 2–4: Save as Draft + primary action */}
      {!exitConfirm && step >= 2 && (
        <div
          className="shrink-0 border-t border-[#E8E9EA] bg-white px-5 py-4"
          style={{ paddingBottom: step === 4
            ? 'max(16px, env(safe-area-inset-bottom))'
            : `max(16px, calc(env(safe-area-inset-bottom) + ${keyboardOffset}px))` }}
        >
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSaveAsDraft}
              disabled={stepLoading}
              className="flex-1 py-3.5 text-sm font-bold text-ink-2 border border-[#D4D5D7] rounded-pill hover:border-ink hover:text-ink transition-colors disabled:opacity-40"
            >
              {stepLoading ? 'Saving…' : 'Save as Draft'}
            </button>
            <button
              type="button"
              onClick={step === 4 ? handlePublish : handleNextStep}
              disabled={step === 4 ? stepLoading : nextDisabled}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-bold text-white bg-orange rounded-pill hover:bg-orange-lt transition-colors disabled:opacity-40"
              style={{ boxShadow: (step === 4 ? stepLoading : nextDisabled) ? 'none' : '0 4px 16px rgba(255,107,53,0.30)' }}
            >
              {((step !== 4 && (generating || stepLoading)) || (step === 4 && stepLoading)) && (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden>
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {step === 4
                ? (stepLoading ? 'Publishing…' : 'Publish Listing')
                : nextLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
