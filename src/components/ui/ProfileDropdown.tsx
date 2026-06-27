'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { MembershipPlan } from '@/lib/types/database'
import PlanBadge from '@/components/ui/PlanBadge'
import { navLinkPrefetch } from '@/lib/navLink'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProfileUser {
  email: string
  full_name: string | null
  company_name: string | null
  plan: MembershipPlan
  listing_count: number
}

// ─── Plan config ──────────────────────────────────────────────────────────────

const PLAN_LIMITS: Record<MembershipPlan, number> = {
  free: 3,
  starter: 15,
  pro: 40,
  max: Infinity,
  premium: Infinity,
}

// Shared with the mobile slide-in menu so both surfaces link to the same places
export const PROFILE_MENU_LINKS = [
  { label: 'My Listings', href: '/dashboard' },
  { label: 'Saved Equipment', href: '/dashboard?tab=saved' },
  { label: 'Account Settings', href: '/dashboard/settings' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
// Exported so the mobile slide-in menu (same logged-in identity, different
// trigger/layout) can render the same avatar/name without duplicating logic.

export function getInitials(fullName: string | null, email: string): string {
  if (fullName) {
    const parts = fullName.trim().split(' ')
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return parts[0][0].toUpperCase()
  }
  return email[0].toUpperCase()
}

export function getFirstName(fullName: string | null, email: string): string {
  if (fullName) return fullName.trim().split(' ')[0]
  return email.split('@')[0]
}

// ─── ProfileDropdown ──────────────────────────────────────────────────────────

export default function ProfileDropdown({ user }: { user: ProfileUser }) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  const initials = getInitials(user.full_name, user.email)
  const firstName = getFirstName(user.full_name, user.email)
  const limit = PLAN_LIMITS[user.plan]
  const meterPct = limit !== Infinity ? Math.min(Math.round((user.listing_count / limit) * 100), 100) : 0
  const showMeter = limit !== Infinity

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen])

  async function handleSignOut() {
    setDropdownOpen(false)
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  function handleManageSubscription() {
    setDropdownOpen(false)
    if (user.plan === 'max') {
      setToast('Billing management coming soon.')
      setTimeout(() => setToast(null), 4000)
    } else {
      router.push('/dashboard/upgrade')
    }
  }

  return (
    <>
      {/* Profile button + dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(o => !o)}
          className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#E8E9EA] rounded-pill hover:border-[#D4D5D7] transition-colors"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
        >
          <div className="w-6 h-6 rounded-full bg-orange flex items-center justify-center shrink-0">
            <span className="text-white text-[10px] font-bold leading-none">{initials}</span>
          </div>
          <span className="text-sm font-medium text-ink">{firstName}</span>
          <svg
            className={`w-3.5 h-3.5 text-ink-3 transition-transform duration-150 ${dropdownOpen ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown panel */}
        {dropdownOpen && (
          <div
            className="absolute right-0 top-full mt-2 bg-white border border-[#E8E9EA] flex flex-col overflow-hidden"
            style={{ width: '240px', borderRadius: '16px', boxShadow: '0 8px 28px rgba(0,0,0,0.12)', zIndex: 60 }}
          >
            {/* User info header */}
            <div className="px-4 pt-4 pb-3 border-b border-[#E8E9EA]">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-full bg-orange flex items-center justify-center shrink-0">
                  <span className="text-white text-sm font-bold leading-none">{initials}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{user.full_name ?? user.email}</p>
                  {user.company_name && (
                    <p className="text-xs text-ink-3 truncate">{user.company_name}</p>
                  )}
                </div>
              </div>

              {/* Plan badge */}
              <PlanBadge plan={user.plan} />

              {/* Listing meter — finite-limit plans only */}
              {showMeter && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-mono text-ink-3 uppercase tracking-wide">Active listings</span>
                    <span className="text-[11px] font-mono font-medium text-ink">{user.listing_count}/{limit}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#F0F0F0] overflow-hidden">
                    <div className="h-full rounded-full bg-orange transition-all" style={{ width: `${meterPct}%` }} />
                  </div>
                </div>
              )}
            </div>

            {/* Menu items */}
            <div className="py-1.5">
              {PROFILE_MENU_LINKS.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={navLinkPrefetch(item.href)}
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center px-4 py-2 text-sm text-ink-2 hover:text-ink hover:bg-bg transition-colors"
                >
                  {item.label}
                </Link>
              ))}

              {/* Upgrade Plan — navigates to /dashboard/upgrade (or coming-soon toast for max) */}
              <button
                className="w-full flex items-center justify-between px-4 py-2 text-sm text-ink-2 hover:text-ink hover:bg-bg transition-colors"
                onClick={handleManageSubscription}
              >
                <span>{user.plan === 'max' ? 'Manage Billing' : 'Upgrade Plan'}</span>
                {user.plan === 'free' && (
                  <span
                    className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-pill border"
                    style={{ background: '#FDF6E3', color: '#7A5C00', borderColor: '#F0D98A' }}
                  >
                    UPGRADE
                  </span>
                )}
              </button>
            </div>

            <div className="border-t border-[#E8E9EA] py-1.5">
              <button
                onClick={handleSignOut}
                className="w-full px-4 py-2 text-sm text-left text-ink-3 hover:text-ink hover:bg-bg transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Toast (for max plan "coming soon") */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[110] pointer-events-none">
          <div
            className="flex items-center gap-2 bg-ink text-white text-sm font-sans px-5 py-3 rounded-pill"
            style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.25)' }}
          >
            <svg className="w-4 h-4 shrink-0 text-[#A2FF9A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {toast}
          </div>
        </div>
      )}
    </>
  )
}
