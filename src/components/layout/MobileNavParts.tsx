'use client'

import Link from 'next/link'
import Image from 'next/image'
import { getInitials, type ProfileUser } from '@/components/ui/ProfileDropdown'

// ─── Shared pieces for every <1024px navbar (public Navbar + DashboardNav) ───
// Icon-only logo, search-icon glyph, the look-alike inline search trigger,
// and the hamburger/avatar collapsed trigger — kept in one place so both
// navbars stay pixel-identical instead of drifting apart over time.

export const TAP_TARGET = 'flex items-center justify-center shrink-0'
export const TAP_SIZE = { width: 44, height: 44 }

export function LogoIcon() {
  return (
    <Link href="/" className="shrink-0">
      <Image
        src="/bd_logo-icon.svg"
        alt="Black Diamond"
        width={68}
        height={57}
        priority
        style={{ height: '28px', width: 'auto' }}
      />
    </Link>
  )
}

export function SearchIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}

export function HamburgerIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  )
}

// Look-alike search pill — visually matches the real SearchBar but is a
// plain button: tapping it always opens the full-screen takeover rather
// than typing inline.
export function SearchBarTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Search"
      className="flex-1 min-w-0 flex items-center gap-2.5 px-3.5 text-left"
      style={{
        height: 40,
        borderRadius: 100,
        border: '1.5px solid #E8E9EA',
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <span className="text-ink-3 shrink-0">
        <SearchIcon />
      </span>
      <span className="text-sm font-sans text-ink-3 truncate">Search equipment...</span>
    </button>
  )
}

// Collapsed right-side trigger for every <1024px navbar. Logged out:
// hamburger. Logged in: circular avatar alone (no name/chevron pill).
// Pages that require authentication (dashboard, settings, etc.) always
// pass a real user, so the hamburger branch simply never applies there.
export function MobileNavTrigger({
  user,
  authReady,
  onClick,
}: {
  user: ProfileUser | null
  authReady: boolean
  onClick: () => void
}) {
  if (!authReady) return <div style={TAP_SIZE} />

  if (user) {
    return (
      <button onClick={onClick} aria-label="Open menu" className={TAP_TARGET} style={TAP_SIZE}>
        <div className="w-9 h-9 rounded-full bg-orange flex items-center justify-center">
          <span className="text-white text-sm font-bold leading-none">
            {getInitials(user.full_name, user.email)}
          </span>
        </div>
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      aria-label="Open menu"
      className={`${TAP_TARGET} text-ink-2 hover:text-ink transition-colors`}
      style={TAP_SIZE}
    >
      <HamburgerIcon />
    </button>
  )
}
