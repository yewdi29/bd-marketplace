'use client'

import { Suspense, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import Link from 'next/link'
import BrandLogo from '@/components/ui/BrandLogo'
import ProfileDropdown, { type ProfileUser } from '@/components/ui/ProfileDropdown'
import SearchBar from '@/components/marketplace/SearchBar'
import MobileMenu from '@/components/layout/MobileMenu'
import MobileSearchTakeover, { type MobileSearchTakeoverHandle } from '@/components/layout/MobileSearchTakeover'
import { LogoIcon, SearchBarTrigger, MobileNavTrigger } from '@/components/layout/MobileNavParts'

const SEARCH_BAR_FALLBACK = (
  <div style={{ height: '40px', borderRadius: '100px', background: 'rgba(255,255,255,0.85)', border: '1.5px solid #E8E9EA' }} />
)

export default function DashboardNav({ user }: { user: ProfileUser }) {
  const [searchTakeoverOpen, setSearchTakeoverOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const searchTakeoverRef = useRef<MobileSearchTakeoverHandle>(null)
  const menuTriggerRef = useRef<HTMLButtonElement>(null)

  // Mutually exclusive — opening one always closes the other first.
  function openSearchTakeover() {
    setMobileMenuOpen(false)
    flushSync(() => setSearchTakeoverOpen(true))
    searchTakeoverRef.current?.focusInput()
  }
  function openMobileMenu() {
    setSearchTakeoverOpen(false)
    setMobileMenuOpen(true)
  }

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: 'rgba(255,255,255,0.20)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(232,233,234,0.30)',
        height: '64px',
      }}
    >
      {/* ── Desktop (≥1024px) — unchanged ─────────────────────────────────────
       * 3-column grid: Logo | SearchBar | Profile
       * Dashboard is never the homepage, so SearchBar always shows. */}
      <div
        className="hidden lg:grid page-shell h-full items-center"
        style={{ gridTemplateColumns: 'auto 1fr auto', gap: '16px' }}
      >
        {/* Col 1: Logo */}
        <Link href="/" className="shrink-0">
          <BrandLogo priority />
        </Link>

        {/* Col 2: SearchBar — centered in remaining space.
         * Suspense required because SearchBar uses useSearchParams(). */}
        <div className="flex justify-center">
          <div className="w-full max-w-[440px]">
            <Suspense fallback={SEARCH_BAR_FALLBACK}>
              <SearchBar variant="nav" placeholder="Search equipment..." />
            </Suspense>
          </div>
        </div>

        {/* Col 3: Profile dropdown only */}
        <ProfileDropdown user={user} />
      </div>

      {/* ── Below 1024px — same "non-homepage" pattern used everywhere else:
       * icon-only logo, full-width inline search trigger, avatar. Every page
       * behind this nav requires auth, so `user` is always present and the
       * hamburger branch of MobileNavTrigger never applies. ─────────────── */}
      <div className="flex lg:hidden items-center h-full px-3 gap-2">
        <LogoIcon />
        <SearchBarTrigger onClick={openSearchTakeover} />
        <MobileNavTrigger ref={menuTriggerRef} user={user} onClick={openMobileMenu} />
      </div>

      <MobileMenu
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        user={user}
        triggerRef={menuTriggerRef}
      />
      <MobileSearchTakeover
        ref={searchTakeoverRef}
        open={searchTakeoverOpen}
        onClose={() => setSearchTakeoverOpen(false)}
      />
    </header>
  )
}
