'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatPrice } from '@/lib/formatPrice'
import NewListingModal from '@/components/listings/NewListingModal'
import EditListingModal from '@/components/listings/EditListingModal'
import type { MembershipPlan } from '@/lib/types/database'

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
  location_city: string | null
  location_state: string | null
  primary_image_url: string | null
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCategory(cat: string): string {
  return cat
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function statusBadge(status: ListingStatus): { bg: string; text: string; border: string; label: string } {
  switch (status) {
    case 'active':
      return { bg: '#F0FFF0', text: '#1A5C18', border: '#C8F5C4', label: 'Active' }
    case 'draft':
      return { bg: '#F4F4F5', text: '#71717A', border: '#E4E4E7', label: 'Draft' }
    case 'pending_review':
      return { bg: '#FDF6E3', text: '#7A5C00', border: '#F0D98A', label: 'Unpublished' }
    case 'sold':
      return { bg: '#FFF0F0', text: '#CC0000', border: '#FFCCCC', label: 'Sold' }
  }
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-[16px] overflow-hidden animate-pulse" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
      <div className="w-full h-[140px] bg-[#F0F0F0]" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-[#F0F0F0] rounded-full w-3/4" />
        <div className="h-3 bg-[#F0F0F0] rounded-full w-1/2" />
        <div className="h-4 bg-[#F0F0F0] rounded-full w-1/3 mt-2" />
      </div>
    </div>
  )
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
  primary?: boolean
  disabled?: boolean
  tooltip?: string
}

function CardOverlay({
  listing,
  onClose,
  onAction,
  onEdit,
  atLimit,
  onLimitReached,
}: {
  listing: MyListing
  onClose: () => void
  onAction: (id: string, action: string) => Promise<void>
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
            label: 'Publish Listing',
            icon: <CheckCircleIcon />,
            onClick: async () => { await onAction(listing.id, 'publish'); onClose() },
            primary: true,
            disabled: !draftReady,
            tooltip: !draftReady ? 'Complete all required fields in the editor before publishing' : undefined,
          },
          { label: 'Edit Draft', icon: <PencilIcon />, onClick: () => { onClose(); onEdit(listing.id) } },
          { label: 'Delete Draft', icon: <TrashIcon />, onClick: async () => { await onAction(listing.id, 'archive'); onClose() }, danger: true },
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
          { label: 'Archive', icon: <TrashIcon />, onClick: async () => { await onAction(listing.id, 'archive'); onClose() }, danger: true },
        ]
      case 'pending_review':
        return [
          { label: 'Edit Listing', icon: <PencilIcon />, onClick: () => { onClose(); onEdit(listing.id) } },
          {
            label: 'Republish',
            icon: <CheckCircleIcon />,
            onClick: async () => {
              if (atLimit) { onClose(); onLimitReached(); return }
              await onAction(listing.id, 'publish'); onClose()
            },
          },
          { label: 'Archive', icon: <TrashIcon />, onClick: async () => { await onAction(listing.id, 'archive'); onClose() }, danger: true },
        ]
    }
  })()

  return (
    <div
      className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 p-3 rounded-[16px]"
      style={{ background: 'rgba(255,255,255,0.50)', backdropFilter: 'blur(8px)' }}
    >
      {actions.map(action => (
        <button
          key={action.label}
          onClick={action.disabled ? undefined : action.onClick}
          title={action.tooltip}
          disabled={action.disabled}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-pill text-sm font-semibold border transition-colors ${
            action.disabled
              ? 'opacity-40 cursor-not-allowed border-[#D4D5D7] bg-white text-ink-2'
              : action.danger
                ? 'border-[#FFCCCC] hover:opacity-80'
                : action.primary
                  ? 'border-orange hover:opacity-90'
                  : 'bg-white text-[#1A1D20] border-[#D4D5D7] hover:border-[#9A9DA2]'
          }`}
          style={
            action.disabled ? undefined :
            action.danger ? { background: '#FFF0F0', color: '#CC0000' } :
            action.primary ? { background: '#FF6B35', color: '#FFFFFF', boxShadow: '0 4px 12px rgba(255,107,53,0.25)' } :
            undefined
          }
        >
          <span className="w-4 h-4 shrink-0">{action.icon}</span>
          {action.label}
        </button>
      ))}
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
  onEdit,
  atLimit,
  onLimitReached,
}: {
  listing: MyListing
  onManage: (l: MyListing) => void
  isManaging: boolean
  onCloseManage: () => void
  onAction: (id: string, action: string) => Promise<void>
  onEdit: (id: string) => void
  atLimit: boolean
  onLimitReached: () => void
}) {
  const badge = statusBadge(listing.status)
  const isNavigable = listing.status === 'active' && !!listing.slug

  function handleCardClick() {
    if (isManaging) return
    if (isNavigable) window.open(`/listings/${listing.slug}`, '_blank')
  }

  return (
    <div
      className="bg-white rounded-[16px] overflow-hidden relative group transition-shadow"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.10)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)')}
    >
      {/* On-card manage overlay (B010) */}
      {isManaging && (
        <CardOverlay
          listing={listing}
          onClose={onCloseManage}
          onAction={onAction}
          onEdit={onEdit}
          atLimit={atLimit}
          onLimitReached={onLimitReached}
        />
      )}

      {/* Clickable area — navigates to public listing (B008) */}
      <div
        className={isNavigable && !isManaging ? 'cursor-pointer' : ''}
        onClick={handleCardClick}
      >
        {/* Image */}
        <div className="w-full h-[140px] bg-[#F0F0F0] relative overflow-hidden">
          {listing.primary_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={listing.primary_image_url}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-10 h-10 text-ink-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          {/* Status badge */}
          <div className="absolute top-2 left-2">
            <span
              className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-bold rounded-pill border"
              style={{ background: badge.bg, color: badge.text, borderColor: badge.border }}
            >
              {badge.label}
            </span>
          </div>
          {/* External link hint for active listings */}
          {isNavigable && !isManaging && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-6 h-6 bg-white border border-[#E8E9EA] rounded-full flex items-center justify-center text-[#1A1D20] hover:border-[#9A9DA2] transition-colors">
                <ExternalLinkIcon />
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3 pb-2">
          <p className="font-mono text-[12px] uppercase tracking-[0.08em] text-ink-3 mb-1">{formatCategory(listing.category)}</p>
          <p className="text-sm font-semibold text-ink leading-snug line-clamp-2 mb-2">{listing.title}</p>
          <p className="font-mono text-sm font-medium text-orange tracking-tight mb-0">
            {formatPrice(listing.price, listing.price_unit ?? 'total', listing.price_visible ?? true)}
          </p>
        </div>
      </div>

      {/* Manage button — stops propagation so card click doesn't fire */}
      <div className="px-3 pb-3 pt-2">
        <button
          onClick={e => { e.stopPropagation(); onManage(listing) }}
          className="w-full py-1.5 text-xs font-semibold text-ink-2 border border-[#E8E9EA] rounded-pill hover:border-[#D4D5D7] hover:text-ink transition-colors"
        >
          Manage
        </button>
      </div>
    </div>
  )
}

// ─── Saved Listing Card ───────────────────────────────────────────────────────

function SavedCard({ listing, onRemove }: { listing: SavedListingItem; onRemove: (id: string) => void }) {
  const [removing, setRemoving] = useState(false)
  const primaryImage = listing.listing_images?.find(img => img.is_primary) ?? listing.listing_images?.[0]
  const href = `/listings/${listing.slug ?? listing.id}`
  const priceDisplay = formatPrice(listing.price, listing.price_unit ?? 'total', listing.price_visible ?? true)
  const locationParts = [listing.location_city, listing.location_state].filter(Boolean)
  const locationText = locationParts.length > 0 ? locationParts.join(', ') : null

  async function handleUnsave(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setRemoving(true)
    try {
      const res = await fetch(`/api/saved/${listing.id}`, { method: 'DELETE' })
      if (res.ok) onRemove(listing.id)
    } finally {
      setRemoving(false)
    }
  }

  return (
    <Link
      href={href}
      className="group block bg-white border border-[#E8E9EA] hover:border-[#D4D5D7] rounded-[16px] overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
    >
      <div className="relative w-full h-[140px] bg-[#F0F0F0] overflow-hidden">
        {primaryImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={primaryImage.url} alt={listing.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-10 h-10 text-ink-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {/* Filled red heart — click removes from saved */}
        <button
          onClick={handleUnsave}
          disabled={removing}
          aria-label="Remove from saved"
          className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center disabled:opacity-50"
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
        >
          <svg className="w-4 h-4" fill="#CC0000" viewBox="0 0 24 24" stroke="#CC0000" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>
      <div className="p-3">
        <p className="font-mono text-[12px] uppercase tracking-[0.08em] text-ink-3 mb-1">{formatCategory(listing.category)}</p>
        <p className="text-sm font-semibold text-ink leading-snug line-clamp-2 mb-2">{listing.title}</p>
        <p className="font-mono text-sm font-medium text-orange">
          {priceDisplay}
        </p>
        {locationText && (
          <p className="text-[11px] text-ink-3 font-sans mt-1.5">{locationText}</p>
        )}
      </div>
    </Link>
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
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [showLimitModal, setShowLimitModal] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Read initial tab from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('tab') === 'saved') setActiveMainTab('saved')
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

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
    setShowNewListing(true)
  }

  // Filter counts — drafts tab includes both 'draft' and 'pending_review' (B012)
  const activeCount = listings.filter(l => l.status === 'active').length
  const draftCount = listings.filter(l => l.status === 'draft' || l.status === 'pending_review').length
  const soldCount = listings.filter(l => l.status === 'sold').length

  const filtered = activeFilter === 'all'
    ? listings
    : activeFilter === 'draft'
      ? listings.filter(l => l.status === 'draft' || l.status === 'pending_review')
      : listings.filter(l => l.status === activeFilter)

  const filterTabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: listings.length },
    { key: 'active', label: 'Active', count: activeCount },
    { key: 'draft', label: 'Drafts', count: draftCount },
    { key: 'sold', label: 'Sold', count: soldCount },
  ]

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8">

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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
              {filtered.map(listing => (
                <MyListingCard
                  key={listing.id}
                  listing={listing}
                  onManage={setManageListing}
                  isManaging={manageListing?.id === listing.id}
                  onCloseManage={() => setManageListing(null)}
                  onAction={handleAction}
                  onEdit={id => { setManageListing(null); setEditListingId(id) }}
                  atLimit={activeCount >= PLAN_LIMITS[plan]}
                  onLimitReached={() => setShowLimitModal(true)}
                />
              ))}
            </div>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : savedListings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-14 h-14 rounded-[14px] bg-[#F0F0F0] flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-ink-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="font-sans font-bold text-base text-ink mb-1">No saved equipment</h3>
              <p className="text-sm text-ink-3 mb-6 max-w-[280px]">
                Browse listings and tap the heart icon to save equipment you&apos;re interested in.
              </p>
              <Link
                href="/listings"
                className="px-5 py-2.5 text-sm font-bold text-white bg-orange rounded-pill hover:bg-orange-lt transition-colors"
                style={{ boxShadow: '0 4px 16px rgba(255,107,53,0.25)' }}
              >
                Browse Equipment
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
              {savedListings.map(listing => (
                <SavedCard
                  key={listing.id}
                  listing={listing}
                  onRemove={id => setSavedListings(prev => prev.filter(l => l.id !== id))}
                />
              ))}
            </div>
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
          onClose={() => setShowNewListing(false)}
          onSuccess={(message) => {
            setShowNewListing(false)
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
