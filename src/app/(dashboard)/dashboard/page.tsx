'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ListingCardClickable from '@/components/listings/ListingCardClickable'
import ListingCardLink from '@/components/listings/ListingCardLink'
import { toListingCardListing } from '@/components/listings/listingCardTypes'
import ListingCardGrid from '@/components/listings/ListingCardGrid'
import ListingCardSkeleton from '@/components/listings/ListingCardSkeleton'
import StaleListingBanner from '@/components/listings/StaleListingBanner'
import NewListingModal from '@/components/listings/NewListingModal'
import EditListingModal from '@/components/listings/EditListingModal'
import type { MembershipPlan } from '@/lib/types/database'
import { isStaleActiveListing } from '@/lib/listings/staleness'

// ─── Types ────────────────────────────────────────────────────────────────────

type ListingStatus = 'active' | 'draft' | 'pending_review' | 'sold'

interface MyListing {
  id: string
  title: string
  category: string
  price: number
  price_unit: string
  price_visible: boolean | null
  status: ListingStatus
  slug: string
  created_at: string
  updated_at: string
  last_approved_at: string | null
  location_city: string | null
  location_state: string | null
  primary_image_url: string | null
  seller_prompt: string | null
}

interface SavedListingItem {
  id: string
  title: string
  category: string
  price: number
  price_unit: string
  price_visible: boolean | null
  slug: string | null
  created_at: string
  location_city: string | null
  location_state: string | null
  listing_images: { url: string; is_primary: boolean; sort_order: number }[]
}

type FilterTab = 'all' | 'active' | 'draft' | 'sold'
type MainTab = 'listings' | 'saved'

function isStepOneDraft(listing: MyListing): boolean {
  return listing.status === 'draft'
    && listing.title === 'Untitled Draft'
    && !!listing.seller_prompt
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusBadge(status: ListingStatus): { bg: string; text: string; border: string; label: string } {
  switch (status) {
    case 'active':
      return { bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0', label: 'Live' }
    case 'draft':
      return { bg: '#F4F4F5', text: '#71717A', border: '#E4E4E7', label: 'Draft' }
    case 'pending_review':
      return { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A', label: 'Pending Approval' }
    case 'sold':
      return { bg: '#FFF0F0', text: '#CC0000', border: '#FFCCCC', label: 'Sold' }
  }
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return <ListingCardSkeleton />
}

// ─── Limit Reached Modal ──────────────────────────────────────────────────────

function LimitReachedModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.30)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="bg-white rounded-[20px] w-full max-w-[380px]"
        style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.18)', padding: '32px' }}
      >
        {/* Icon */}
        <div
          className="w-11 h-11 flex items-center justify-center rounded-[10px] mb-5"
          style={{ background: '#FFF2ED' }}
        >
          <svg className="w-5 h-5 text-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>

        {/* Heading */}
        <p
          className="font-sans font-bold text-ink mb-2"
          style={{ fontSize: '16px', letterSpacing: '-0.01em' }}
        >
          Active Listing Limit Reached
        </p>

        {/* Body */}
        <p className="font-sans text-ink-3 mb-6" style={{ fontSize: '14px', lineHeight: '1.6' }}>
          Your active listings limit has been met.{' '}
          <a
            href="/dashboard/upgrade"
            className="text-ink underline underline-offset-2 hover:text-orange transition-colors"
          >
            Upgrade
          </a>{' '}
          your membership to list more.
        </p>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-bold text-ink-2 border border-[#D4D5D7] rounded-pill hover:border-[#9A9DA2] hover:text-ink transition-colors"
          >
            Dismiss
          </button>
          <a
            href="/dashboard/upgrade"
            className="flex-1 py-2.5 text-sm font-bold text-white text-center rounded-pill hover:bg-orange-lt transition-colors"
            style={{ background: '#FF6B35', boxShadow: '0 4px 16px rgba(255,107,53,0.25)' }}
          >
            Upgrade Plan
          </a>
        </div>
      </div>
    </div>
  )
}

// ─── On-card manage overlay (B010) ────────────────────────────────────────────

interface CardAction {
  label: string
  icon: React.ReactNode
  onClick: () => void
  danger?: boolean
  /** Light orange tint — publish actions (matches delete-draft outline pattern) */
  accent?: boolean
  disabled?: boolean
  tooltip?: string
}

function CardOverlay({
  listing,
  onClose,
  onAction,
  onDelete,
  onEdit,
  atLimit,
  onLimitReached,
}: {
  listing: MyListing
  onClose: () => void
  onAction: (id: string, action: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onEdit: (id: string) => void
  atLimit: boolean
  onLimitReached: () => void
}) {
  const actions: CardAction[] = (() => {
    switch (listing.status) {
      case 'active':
        return [
          { label: 'Edit Listing', icon: <PencilIcon />, onClick: () => { onClose(); onEdit(listing.id) } },
          { label: 'Unpublish', icon: <EyeOffIcon />, onClick: async () => { await onAction(listing.id, 'unpublish'); onClose() } },
          { label: 'Mark as Sold', icon: <CheckCircleIcon />, onClick: async () => { await onAction(listing.id, 'sold'); onClose() } },
        ]
      case 'draft': {
        const draftReady = !!(
          listing.title && listing.title !== 'Untitled Draft' &&
          listing.category &&
          listing.price > 0 &&
          (listing.location_city || listing.location_state) &&
          listing.primary_image_url
        )
        return [
          {
            label: 'Publish',
            icon: <CheckCircleIcon />,
            onClick: async () => { await onAction(listing.id, 'publish'); onClose() },
            accent: true,
            disabled: !draftReady,
            tooltip: !draftReady ? 'Complete all required fields in the editor before publishing' : undefined,
          },
          { label: 'Edit Draft', icon: <PencilIcon />, onClick: () => { onClose(); onEdit(listing.id) } },
          { label: 'Delete Draft', icon: <TrashIcon />, onClick: () => { onClose(); onDelete(listing.id) }, danger: true },
        ]
      }
      case 'sold':
        return [
          {
            label: 'Relist',
            icon: <RefreshIcon />,
            onClick: async () => {
              if (atLimit) { onClose(); onLimitReached(); return }
              await onAction(listing.id, 'publish'); onClose()
            },
          },
          { label: 'Archive', icon: <TrashIcon />, onClick: () => { onClose(); onDelete(listing.id) }, danger: true },
        ]
      case 'pending_review':
        return [
          {
            label: 'Publish',
            icon: <CheckCircleIcon />,
            onClick: async () => {
              if (atLimit) { onClose(); onLimitReached(); return }
              await onAction(listing.id, 'publish'); onClose()
            },
            accent: true,
          },
          { label: 'Edit Listing', icon: <PencilIcon />, onClick: () => { onClose(); onEdit(listing.id) } },
          { label: 'Archive', icon: <TrashIcon />, onClick: () => { onClose(); onDelete(listing.id) }, danger: true },
        ]
    }
  })()

  return (
    <div
      className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 p-3 rounded-[12px]"
      style={{ background: 'rgba(255,255,255,0.50)', backdropFilter: 'blur(8px)' }}
      onClick={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
      onTouchStart={e => e.stopPropagation()}
    >
      {actions.map(action =>
        action.danger ? (
          <HoldToDeleteButton
            key={action.label}
            label={action.label}
            icon={action.icon}
            onComplete={action.onClick}
            disabled={action.disabled}
          />
        ) : (
          <button
            key={action.label}
            onClick={action.disabled ? undefined : action.onClick}
            title={action.tooltip}
            disabled={action.disabled}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-pill text-sm font-semibold border transition-colors ${
              action.disabled
                ? 'opacity-40 cursor-not-allowed border-[#D4D5D7] bg-white text-ink-2'
                : action.accent
                  ? 'bg-orange-bg text-orange border-orange-bdr hover:border-orange'
                  : 'bg-white text-[#1A1D20] border-[#D4D5D7] hover:border-[#9A9DA2]'
            }`}
          >
            <span className="w-4 h-4 shrink-0">{action.icon}</span>
            {action.label}
          </button>
        )
      )}
      <div className="w-full border-t border-[#E8E9EA] mt-2 pt-2">
        <button
          onClick={onClose}
          className="w-full flex items-center justify-center px-3 py-2 rounded-pill text-sm font-semibold border border-[#E8E9EA] transition-colors hover:border-[#D4D5D7]"
          style={{ background: '#F7F8F9', color: '#4A4D52' }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ─── Hold-to-delete button (tap shows "Hold to delete" tip; 1.5s hold fires deletion) ──

const HOLD_DELETE_MS = 1500
const HOLD_TAP_THRESHOLD_MS = 300
const HOLD_TIP_DURATION_MS = 2000

function HoldToDeleteButton({
  label,
  icon,
  onComplete,
  disabled,
}: {
  label: string
  icon: React.ReactNode
  onComplete: () => void
  disabled?: boolean
}) {
  const [progress, setProgress] = useState(0)
  const [showTip, setShowTip] = useState(false)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef(0)
  const completedRef = useRef(false)
  const tipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      if (tipTimerRef.current) clearTimeout(tipTimerRef.current)
    }
  }, [])

  function cancelHoldLoop() {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }

  function tick() {
    const elapsed = Date.now() - startRef.current
    const pct = Math.min(100, (elapsed / HOLD_DELETE_MS) * 100)
    setProgress(pct)
    if (pct >= 100) {
      completedRef.current = true
      cancelHoldLoop()
      onComplete()
      return
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  function stopEvent(e: React.MouseEvent | React.TouchEvent) {
    e.stopPropagation()
  }

  function startHold(e: React.MouseEvent | React.TouchEvent) {
    if (disabled) return
    stopEvent(e)
    if ('button' in e && e.button !== 0) return

    completedRef.current = false
    setShowTip(false)
    if (tipTimerRef.current) clearTimeout(tipTimerRef.current)
    startRef.current = Date.now()
    setProgress(0)
    cancelHoldLoop()
    rafRef.current = requestAnimationFrame(tick)
  }

  function endHold(e?: React.MouseEvent | React.TouchEvent) {
    if (disabled) return
    e?.stopPropagation()
    if (completedRef.current) return

    const elapsed = startRef.current ? Date.now() - startRef.current : 0
    cancelHoldLoop()
    setProgress(0)

    if (elapsed > 0 && elapsed < HOLD_TAP_THRESHOLD_MS) {
      setShowTip(true)
      if (tipTimerRef.current) clearTimeout(tipTimerRef.current)
      tipTimerRef.current = setTimeout(() => setShowTip(false), HOLD_TIP_DURATION_MS)
    }
  }

  return (
    <div className="relative w-full">
      {showTip && !disabled && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1 rounded-[6px] text-[11px] font-semibold text-white whitespace-nowrap pointer-events-none z-20"
          style={{ background: '#1A1D20' }}
          role="tooltip"
        >
          Hold to delete
        </div>
      )}

      <button
        type="button"
        disabled={disabled}
        onMouseDown={startHold}
        onMouseUp={endHold}
        onMouseLeave={() => endHold()}
        onTouchStart={startHold}
        onTouchEnd={endHold}
        onTouchCancel={endHold}
        onClick={stopEvent}
        onContextMenu={e => e.preventDefault()}
        className={`relative w-full overflow-hidden rounded-pill text-sm font-semibold border select-none touch-none ${
          disabled ? 'opacity-40 cursor-not-allowed border-[#D4D5D7] bg-white text-ink-2' : 'border-[#FFCCCC] text-[#CC0000]'
        }`}
      >
        {/* Base + progress layers */}
        {!disabled && (
          <>
            <span
              className="absolute inset-0 rounded-pill"
              style={{ background: '#FFF0F0' }}
              aria-hidden
            />
            {progress > 0 && (
              <span
                className="absolute inset-y-0 left-0"
                style={{
                  width: `${progress}%`,
                  background: 'rgba(220,38,38,0.45)',
                }}
                aria-hidden
              />
            )}
          </>
        )}

        {/* Label — stays above progress fill */}
        <span className="relative z-10 flex items-center gap-2 px-3 py-2">
          <span className="w-4 h-4 shrink-0">{icon}</span>
          {label}
        </span>
      </button>
    </div>
  )
}

// ─── Plan limits ─────────────────────────────────────────────────────────────

const PLAN_LIMITS: Record<MembershipPlan, number> = {
  free: 3,
  starter: 15,
  pro: 40,
  max: Infinity,
  premium: Infinity, // legacy rows — treat as unlimited
}

// ─── Icon components ──────────────────────────────────────────────────────────

function PencilIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  )
}
function EyeOffIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  )
}
function CheckCircleIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
function TrashIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  )
}
function ExternalLinkIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  )
}
function RefreshIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  )
}

// ─── My Listing Card ──────────────────────────────────────────────────────────

function MyListingCard({
  listing,
  onManage,
  isManaging,
  onCloseManage,
  onAction,
  onRelist,
  onDelete,
  onEdit,
  atLimit,
  onLimitReached,
  isDeleting,
  actionLoadingKey,
}: {
  listing: MyListing
  onManage: (l: MyListing) => void
  isManaging: boolean
  onCloseManage: () => void
  onAction: (id: string, action: string) => Promise<void>
  onRelist: (id: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onEdit: (id: string) => void
  atLimit: boolean
  onLimitReached: () => void
  isDeleting: boolean
  actionLoadingKey: string | null
}) {
  const badge = statusBadge(listing.status)
  const isNavigable = listing.status === 'active' && !!listing.slug
  const isStale = isStaleActiveListing(listing.status, listing.updated_at)
  const relistLoading = actionLoadingKey === `${listing.id}:relist`
  const soldLoading = actionLoadingKey === `${listing.id}:sold`

  function handleCardClick() {
    if (isManaging || isDeleting) return
    if (isNavigable) window.open(`/listings/${listing.slug}`, '_blank')
  }

  return (
    <div>
      <div
        className={`relative rounded-[12px] overflow-hidden${isManaging ? ' z-20' : ''}`}
        style={{
          opacity: isDeleting ? 0 : 1,
          transform: isDeleting ? 'scale(0.94)' : 'scale(1)',
          transition: 'opacity 300ms ease, transform 300ms ease',
          pointerEvents: isDeleting ? 'none' : undefined,
        }}
      >
        {isManaging && (
          <CardOverlay
            listing={listing}
            onClose={onCloseManage}
            onAction={onAction}
            onDelete={onDelete}
            onEdit={onEdit}
            atLimit={atLimit}
            onLimitReached={onLimitReached}
          />
        )}

        <ListingCardClickable
          listing={toListingCardListing(listing)}
          onClick={handleCardClick}
          showSave={false}
          showShare={false}
          disableHoverLift={isManaging || isDeleting}
          thumbnailOverlay={
            <>
              <div className="absolute top-2 left-2">
                <span
                  className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-bold rounded-pill border"
                  style={{ background: badge.bg, color: badge.text, borderColor: badge.border }}
                >
                  {badge.label}
                </span>
              </div>
              {isNavigable && !isManaging && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-6 h-6 bg-white border border-[#E8E9EA] rounded-full flex items-center justify-center text-[#1A1D20] hover:border-[#9A9DA2] transition-colors">
                    <ExternalLinkIcon />
                  </div>
                </div>
              )}
            </>
          }
          footer={
            <div className="px-3 pb-3 pt-0">
              {isStale && !isManaging && (
                <StaleListingBanner
                  onRelist={() => void onRelist(listing.id)}
                  onMarkSold={() => void onAction(listing.id, 'sold')}
                  relistLoading={relistLoading}
                  soldLoading={soldLoading}
                />
              )}
              <button
                onClick={e => { e.stopPropagation(); onManage(listing) }}
                className="w-full py-1.5 text-xs font-semibold text-ink-2 border border-[#E8E9EA] rounded-pill hover:border-[#D4D5D7] hover:text-ink transition-colors"
              >
                Manage
              </button>
            </div>
          }
        />
      </div>
      {listing.status === 'pending_review' && (
        <p className="mt-2 px-1 text-[12px] leading-relaxed" style={{ color: '#9CA3AF' }}>
          {listing.last_approved_at
            ? 'Your listing was updated and is pending re-approval. It will go live again once reviewed by our team.'
            : 'Your listing is pending approval and will go live once reviewed by our team.'}
        </p>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('listings')
  const [listings, setListings] = useState<MyListing[]>([])
  const [savedListings, setSavedListings] = useState<SavedListingItem[]>([])
  const [plan, setPlan] = useState<MembershipPlan>('free')
  const [loading, setLoading] = useState(true)
  const [savedLoading, setSavedLoading] = useState(false)
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')
  const [manageListing, setManageListing] = useState<MyListing | null>(null)
  const [editListingId, setEditListingId] = useState<string | null>(null)
  const [showNewListing, setShowNewListing] = useState(false)
  const [resumeListingId, setResumeListingId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<string | null>(null)
  const [showLimitModal, setShowLimitModal] = useState(false)
  const [sellerId, setSellerId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Read initial tab + upgrade success from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('tab') === 'saved') setActiveMainTab('saved')

    if (params.get('upgrade') === 'success') {
      // Remove the query param without a full reload
      const clean = window.location.pathname
      window.history.replaceState({}, '', clean)

      // Show success toast after data loads (plan fetched in fetchData)
      const timerId = setTimeout(async () => {
        const supabaseInstance = createClient()
        const { data: { user } } = await supabaseInstance.auth.getUser()
        if (!user) return
        const { data } = await supabaseInstance
          .from('users')
          .select('plan')
          .eq('id', user.id)
          .single()
        const planName = data?.plan
          ? (data.plan === 'starter' ? 'Starter'
            : data.plan === 'pro' ? 'Pro'
            : data.plan === 'max' ? 'Max'
            : data.plan.charAt(0).toUpperCase() + data.plan.slice(1))
          : 'Premium'
        setToast(`You're now on ${planName}. Welcome to Black Diamond.`)
        setTimeout(() => setToast(null), 5000)
      }, 800)
      return () => clearTimeout(timerId)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setSellerId(user.id)

      const [planRes, listingsRes] = await Promise.all([
        supabase.from('users').select('plan').eq('id', user.id).single(),
        fetch('/api/listings/my'),
      ])

      if (planRes.data) setPlan(planRes.data.plan)

      if (listingsRes.ok) {
        const json = await listingsRes.json() as { listings: MyListing[] }
        setListings(json.listings ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [supabase, router])

  const fetchSaved = useCallback(async () => {
    setSavedLoading(true)
    try {
      const res = await fetch('/api/saved')
      if (res.ok) {
        const json = await res.json() as { listings: SavedListingItem[] }
        setSavedListings(json.listings ?? [])
      }
    } finally {
      setSavedLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const newListingFromUrl = useRef(false)
  useEffect(() => {
    if (loading || newListingFromUrl.current) return

    const params = new URLSearchParams(window.location.search)
    if (params.get('new') !== 'true') return

    newListingFromUrl.current = true
    params.delete('new')
    const remaining = params.toString()
    window.history.replaceState({}, '', window.location.pathname + (remaining ? `?${remaining}` : ''))

    const activeCount = listings.filter(l => l.status === 'active').length
    const limit = PLAN_LIMITS[plan]
    if (activeCount >= limit) {
      router.push('/dashboard/upgrade')
      return
    }
    setResumeListingId(null)
    setShowNewListing(true)
  }, [loading, listings, plan, router])

  useEffect(() => {
    if (!sellerId) return

    const channel = supabase
      .channel(`seller-listings-${sellerId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'listings',
          filter: `seller_id=eq.${sellerId}`,
        },
        payload => {
          const updated = payload.new as { id?: string; status?: ListingStatus }
          if (!updated.id || !updated.status) return

          setListings(prev =>
            prev.map(listing =>
              listing.id === updated.id
                ? { ...listing, status: updated.status as ListingStatus }
                : listing,
            ),
          )
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sellerId, supabase])

  useEffect(() => {
    if (activeMainTab === 'saved') fetchSaved()
  }, [activeMainTab, fetchSaved])

  function handleMainTabSwitch(tab: MainTab) {
    setActiveMainTab(tab)
    const url = new URL(window.location.href)
    if (tab === 'saved') url.searchParams.set('tab', 'saved')
    else url.searchParams.delete('tab')
    router.replace(url.pathname + url.search, { scroll: false })
  }

  async function handleAction(id: string, action: string) {
    setActionLoading(`${id}:${action}`)
    try {
      const res = await fetch(`/api/listings/${id}/${action}`, { method: 'PATCH' })
      if (!res.ok) {
        const json = await res.json() as { error?: string }
        console.error('Action failed:', json.error)
        return
      }
      await fetchData()
    } finally {
      setActionLoading(null)
    }
  }

  async function handleRelist(id: string) {
    const now = new Date().toISOString()
    setListings(prev => prev.map(listing => (
      listing.id === id ? { ...listing, updated_at: now } : listing
    )))
    setActionLoading(`${id}:relist`)
    try {
      const res = await fetch(`/api/listings/${id}/relist`, { method: 'PATCH' })
      if (!res.ok) {
        const json = await res.json() as { error?: string }
        console.error('Relist failed:', json.error)
        await fetchData()
        return
      }
      const json = await res.json() as { updated_at?: string }
      if (json.updated_at) {
        setListings(prev => prev.map(listing => (
          listing.id === id ? { ...listing, updated_at: json.updated_at! } : listing
        )))
      }
    } finally {
      setActionLoading(null)
    }
  }

  const DELETE_FADE_MS = 320

  async function handleDelete(id: string) {
    setManageListing(prev => (prev?.id === id ? null : prev))
    setActionLoading(`${id}:delete`)
    try {
      const listing = listings.find(l => l.id === id)
      const stepOneDraft = listing ? isStepOneDraft(listing) : false
      const res = await fetch(
        stepOneDraft ? `/api/listings/${id}` : `/api/listings/${id}/archive`,
        { method: stepOneDraft ? 'DELETE' : 'PATCH' },
      )
      if (!res.ok) {
        const json = await res.json().catch(() => ({})) as { error?: string }
        // Listing may already have been hard-deleted — drop ghost card from UI
        if (res.status === 403 || res.status === 404) {
          setDeletingIds(prev => new Set(prev).add(id))
          setTimeout(() => {
            setListings(prev => prev.filter(l => l.id !== id))
            setDeletingIds(prev => {
              const next = new Set(prev)
              next.delete(id)
              return next
            })
            showToast('Listing deleted')
          }, DELETE_FADE_MS)
          return
        }
        console.error('Delete failed:', json.error)
        return
      }
      setDeletingIds(prev => new Set(prev).add(id))
      setTimeout(() => {
        setListings(prev => prev.filter(l => l.id !== id))
        setDeletingIds(prev => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
        showToast('Listing deleted')
      }, DELETE_FADE_MS)
    } finally {
      setActionLoading(null)
    }
  }

  function showToast(message: string) {
    setToast(message)
    setTimeout(() => setToast(null), 4000)
  }

  function handleNewListing() {
    const activeCount = listings.filter(l => l.status === 'active').length
    const limit = PLAN_LIMITS[plan]
    if (activeCount >= limit) {
      router.push('/dashboard/upgrade')
      return
    }
    setResumeListingId(null)
    setShowNewListing(true)
  }

  function handleEditListing(listing: MyListing) {
    setManageListing(null)
    if (isStepOneDraft(listing)) {
      setResumeListingId(listing.id)
      setShowNewListing(true)
    } else {
      setEditListingId(listing.id)
    }
  }

  // Grouped arrays — used for sectioned "All" view and filter counts
  const activeListings      = listings.filter(l => l.status === 'active')
  const unpublishedListings = listings.filter(l => l.status === 'draft' || l.status === 'pending_review')
  const soldListings        = listings.filter(l => l.status === 'sold')

  const activeCount = activeListings.length
  const draftCount  = unpublishedListings.length
  const soldCount   = soldListings.length

  const filtered = activeFilter === 'all'
    ? [...activeListings, ...unpublishedListings, ...soldListings]
    : activeFilter === 'draft'
      ? unpublishedListings
      : listings.filter(l => l.status === activeFilter)

  const filterTabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: listings.length },
    { key: 'active', label: 'Active', count: activeCount },
    { key: 'draft', label: 'Drafts', count: draftCount },
    { key: 'sold', label: 'Sold', count: soldCount },
  ]

  return (
    <div className="page-shell py-8">

      {/* Main tabs */}
      <div className="flex items-center gap-1 mb-8 border-b border-[#E8E9EA]">
        {(['listings', 'saved'] as MainTab[]).map(tab => {
          const isActive = activeMainTab === tab
          const label = tab === 'listings' ? 'My Listings' : 'Saved Equipment'
          return (
            <button
              key={tab}
              onClick={() => handleMainTabSwitch(tab)}
              className="px-4 py-2.5 text-sm font-semibold transition-colors relative"
              style={{
                color: isActive ? '#1A1D20' : '#9A9DA2',
                borderBottom: isActive ? '2px solid #1A1D20' : '2px solid transparent',
                marginBottom: '-1px',
              }}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* ── My Listings tab ── */}
      {activeMainTab === 'listings' && (
        <>
          {/* Page header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-sans font-bold text-2xl text-ink" style={{ letterSpacing: '-0.02em' }}>
                My Listings
              </h1>
              {!loading && PLAN_LIMITS[plan] !== Infinity && (
                <p className="text-sm text-ink-3 mt-0.5">
                  <span className="font-mono">{activeCount}/{PLAN_LIMITS[plan]}</span> active listings used
                </p>
              )}
            </div>
            <button
              onClick={handleNewListing}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-orange rounded-pill hover:bg-orange-lt transition-colors"
              style={{ boxShadow: '0 4px 16px rgba(255,107,53,0.25)' }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New Listing
            </button>
          </div>

          {/* Filter pills */}
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            {filterTabs.map(tab => {
              const isActive = activeFilter === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveFilter(tab.key)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium rounded-pill border transition-colors ${
                    isActive
                      ? 'bg-ink text-white border-ink'
                      : 'bg-white text-ink-2 border-[#E8E9EA] hover:border-[#D4D5D7] hover:text-ink'
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-[#F0F0F0] text-ink-3'
                    }`}>
                      {tab.key === 'active' && PLAN_LIMITS[plan] !== Infinity
                        ? `${tab.count}/${PLAN_LIMITS[plan]}`
                        : tab.count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Content */}
          {loading ? (
            <ListingCardGrid gap="dashboard">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </ListingCardGrid>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-14 h-14 rounded-[14px] bg-[#F0F0F0] flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-ink-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              {listings.length === 0 ? (
                <>
                  <h3 className="font-sans font-bold text-base text-ink mb-1">No listings yet</h3>
                  <p className="text-sm text-ink-3 mb-6 max-w-[280px]">
                    Start selling by posting your first piece of equipment.
                  </p>
                  <button
                    onClick={handleNewListing}
                    className="px-5 py-2.5 text-sm font-bold text-white bg-orange rounded-pill hover:bg-orange-lt transition-colors"
                    style={{ boxShadow: '0 4px 16px rgba(255,107,53,0.25)' }}
                  >
                    Post Your First Listing
                  </button>
                </>
              ) : (
                <>
                  <h3 className="font-sans font-bold text-base text-ink mb-1">No {activeFilter} listings</h3>
                  <p className="text-sm text-ink-3">Switch to a different filter to see your listings.</p>
                </>
              )}
            </div>
          ) : (
            <ListingCardGrid gap="dashboard">
              {filtered.map(listing => (
                <MyListingCard
                  key={listing.id}
                  listing={listing}
                  onManage={setManageListing}
                  isManaging={manageListing?.id === listing.id}
                  onCloseManage={() => setManageListing(null)}
                  onAction={handleAction}
                  onRelist={handleRelist}
                  onDelete={handleDelete}
                  onEdit={() => handleEditListing(listing)}
                  atLimit={activeCount >= PLAN_LIMITS[plan]}
                  onLimitReached={() => setShowLimitModal(true)}
                  isDeleting={deletingIds.has(listing.id)}
                  actionLoadingKey={actionLoading}
                />
              ))}
            </ListingCardGrid>
          )}

          {/* Click-outside backdrop — dismisses the card manage overlay */}
          {manageListing && (
            <div
              className="fixed inset-0 z-[5]"
              onClick={() => setManageListing(null)}
            />
          )}
        </>
      )}

      {/* ── Saved Equipment tab ── */}
      {activeMainTab === 'saved' && (
        <>
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-sans font-bold text-2xl text-ink" style={{ letterSpacing: '-0.02em' }}>
              Saved Equipment
            </h1>
          </div>

          {savedLoading ? (
            <ListingCardGrid gap="dashboard" className="listing-card-grid--saved">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </ListingCardGrid>
          ) : savedListings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-14 h-14 rounded-[14px] bg-[#F0F0F0] flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-ink-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="font-sans font-bold text-base text-ink mb-1">No saved listings yet</h3>
              <p className="text-sm text-ink-3 mb-6 max-w-[280px]">
                Browse equipment and hit Save to build your list.
              </p>
              <Link
                href="/search"
                className="px-5 py-2.5 text-sm font-bold text-white bg-orange rounded-pill hover:bg-orange-lt transition-colors"
                style={{ boxShadow: '0 4px 16px rgba(255,107,53,0.25)' }}
              >
                Browse Equipment
              </Link>
            </div>
          ) : (
            <ListingCardGrid gap="dashboard" className="listing-card-grid--saved">
              {savedListings.map(listing => (
                <ListingCardLink
                  key={listing.id}
                  listing={listing}
                  isLoggedIn
                  initialSaved
                  onUnsave={id => setSavedListings(prev => prev.filter(l => l.id !== id))}
                />
              ))}
            </ListingCardGrid>
          )}
        </>
      )}

      {/* Limit Reached Modal */}
      {showLimitModal && (
        <LimitReachedModal onClose={() => setShowLimitModal(false)} />
      )}

      {/* Edit Listing Modal (B011) */}
      {editListingId && (
        <EditListingModal
          listingId={editListingId}
          onClose={() => setEditListingId(null)}
          onSaved={() => { fetchData(); showToast('Listing updated') }}
        />
      )}


      {/* Action loading overlay — subtle */}
      {actionLoading && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100]">
          <div className="bg-ink text-white text-xs font-mono px-4 py-2 rounded-pill" style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.25)' }}>
            Updating...
          </div>
        </div>
      )}

      {/* New Listing Modal */}
      {showNewListing && (
        <NewListingModal
          resumeListingId={resumeListingId}
          onClose={() => {
            setShowNewListing(false)
            setResumeListingId(null)
          }}
          onDraftRemoved={(id) => {
            setListings(prev => prev.filter(l => l.id !== id))
            setShowNewListing(false)
            setResumeListingId(null)
          }}
          onSuccess={(message) => {
            setShowNewListing(false)
            setResumeListingId(null)
            fetchData()
            if (message) showToast(message)
          }}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[110] pointer-events-none">
          <div
            className="flex items-center gap-2 bg-ink text-white text-sm font-sans px-5 py-3 rounded-pill"
            style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.25)' }}
          >
            <svg className="w-4 h-4 text-[#A2FF9A] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {toast}
          </div>
        </div>
      )}
    </div>
  )
}
