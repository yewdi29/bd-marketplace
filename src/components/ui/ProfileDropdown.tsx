'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export interface ProfileUser {
  email: string
  full_name: string | null
  company_name: string | null
  plan: 'free' | 'premium'
  listing_count: number
}

function getInitials(fullName: string | null, email: string): string {
  if (fullName) {
    const parts = fullName.trim().split(' ')
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return parts[0][0].toUpperCase()
  }
  return email[0].toUpperCase()
}

function getFirstName(fullName: string | null, email: string): string {
  if (fullName) return fullName.trim().split(' ')[0]
  return email.split('@')[0]
}

export default function ProfileDropdown({ user }: { user: ProfileUser }) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [subPanelOpen, setSubPanelOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  const initials = getInitials(user.full_name, user.email)
  const firstName = getFirstName(user.full_name, user.email)
  const meterPct = Math.min(Math.round((user.listing_count / 3) * 100), 100)

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
              {user.plan === 'premium' ? (
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono font-bold rounded-pill border"
                  style={{ background: '#FDF6E3', color: '#7A5C00', borderColor: '#F0D98A' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#D4A017' }} />
                  PREMIUM
                </span>
              ) : (
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono font-bold rounded-pill border"
                  style={{ background: '#FFF2ED', color: '#FF6B35', borderColor: '#FFD4C2' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-orange" />
                  FREE PLAN
                </span>
              )}

              {/* Listing meter — free only */}
              {user.plan === 'free' && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-mono text-ink-3 uppercase tracking-wide">Listings used</span>
                    <span className="text-[11px] font-mono font-medium text-ink">{user.listing_count}/3</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#F0F0F0] overflow-hidden">
                    <div className="h-full rounded-full bg-orange transition-all" style={{ width: `${meterPct}%` }} />
                  </div>
                </div>
              )}
            </div>

            {/* Menu items */}
            <div className="py-1.5">
              {[
                { label: 'My Listings', href: '/dashboard' },
                { label: 'Saved Equipment', href: '/dashboard?tab=saved' },
                { label: 'Account Settings', href: '/dashboard/settings' },
              ].map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center px-4 py-2 text-sm text-ink-2 hover:text-ink hover:bg-bg transition-colors"
                >
                  {item.label}
                </Link>
              ))}

              {/* Manage Subscription */}
              <button
                className="w-full flex items-center justify-between px-4 py-2 text-sm text-ink-2 hover:text-ink hover:bg-bg transition-colors"
                onClick={() => { setDropdownOpen(false); setSubPanelOpen(true) }}
              >
                <span>Manage Subscription</span>
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

      {/* Subscription side panel */}
      {subPanelOpen && (
        <>
          <div
            className="fixed inset-0 z-[70]"
            style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}
            onClick={() => setSubPanelOpen(false)}
          />
          <div
            className="fixed right-0 top-0 bottom-0 bg-white z-[80] flex flex-col overflow-y-auto"
            style={{
              width: '340px',
              borderLeft: '1px solid #E8E9EA',
              boxShadow: '-8px 0 32px rgba(0,0,0,0.10)',
            }}
          >
            {/* Panel header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#E8E9EA]">
              <h2 className="font-sans font-bold text-base text-ink" style={{ letterSpacing: '-0.01em' }}>
                Manage Subscription
              </h2>
              <button
                onClick={() => setSubPanelOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-bg text-ink-3 hover:text-ink transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-5 flex flex-col gap-4">
              <p className="text-xs font-sans text-ink-3 uppercase tracking-wider font-semibold">Current Plan</p>

              {/* Free plan card */}
              <div
                className="border rounded-[16px] p-4"
                style={{
                  borderColor: user.plan === 'free' ? '#FFD4C2' : '#E8E9EA',
                  background: user.plan === 'free' ? '#FFF9F7' : '#FAFAFA',
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-sans font-bold text-sm text-ink">Free</span>
                  {user.plan === 'free' && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-pill bg-orange text-white">CURRENT</span>
                  )}
                </div>
                <ul className="space-y-2">
                  {[
                    { label: 'Up to 3 listings', active: true },
                    { label: 'Direct buyer contact', active: true },
                    { label: 'Standard support', active: true },
                    { label: 'Unlimited listings', active: false },
                    { label: 'Priority placement', active: false },
                    { label: 'Full broker support', active: false },
                  ].map(f => (
                    <li key={f.label} className={`flex items-center gap-2 text-sm ${f.active ? 'text-ink' : 'text-ink-3'}`}>
                      <span className={`text-xs font-bold ${f.active ? 'text-orange' : 'text-ink-3'}`}>
                        {f.active ? '✓' : '×'}
                      </span>
                      {f.label}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Premium plan card */}
              <div
                className="border rounded-[16px] p-4"
                style={{
                  borderColor: user.plan === 'premium' ? '#F0D98A' : '#E8E9EA',
                  background: user.plan === 'premium' ? '#FDFAF0' : '#FAFAFA',
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-sans font-bold text-sm text-ink">Premium</span>
                  <div className="flex items-center gap-2">
                    {user.plan === 'premium' && (
                      <span
                        className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-pill border"
                        style={{ background: '#FDF6E3', color: '#7A5C00', borderColor: '#F0D98A' }}
                      >
                        CURRENT
                      </span>
                    )}
                    <span className="font-mono text-sm font-medium text-ink-2">
                      $49<span className="text-xs text-ink-3">/mo</span>
                    </span>
                  </div>
                </div>
                <ul className="space-y-2">
                  {[
                    'Unlimited listings',
                    'Priority placement',
                    'Full broker support',
                    'Direct buyer contact',
                    'Standard support',
                    'Dedicated account manager',
                  ].map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-ink">
                      <span className="text-xs font-bold text-orange">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              {user.plan === 'free' && (
                <>
                  <button
                    className="w-full py-3 text-sm font-bold text-white bg-orange rounded-pill hover:bg-orange-lt transition-colors"
                    style={{ boxShadow: '0 4px 16px rgba(255,107,53,0.30)' }}
                  >
                    Upgrade to Premium
                  </button>
                  <p className="text-xs text-ink-3 text-center">
                    Cancel anytime · No contracts · Billed monthly
                  </p>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}
