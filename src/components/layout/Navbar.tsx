'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useRef, Suspense } from 'react'
import { flushSync } from 'react-dom'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import ProfileDropdown from '@/components/ui/ProfileDropdown'
import SearchBar from '@/components/marketplace/SearchBar'
import MobileMenu from '@/components/layout/MobileMenu'
import MobileSearchTakeover, { type MobileSearchTakeoverHandle } from '@/components/layout/MobileSearchTakeover'
import { LogoIcon, SearchIcon, SearchBarTrigger, MobileNavTrigger, TAP_TARGET, TAP_SIZE } from '@/components/layout/MobileNavParts'

function Logo() {
  return (
    <Link href="/" className="shrink-0">
      <Image
        src="/bd_logo-black.svg"
        alt="Black Diamond"
        width={140}
        height={40}
        priority
        style={{ height: '27px', width: 'auto' }}
      />
    </Link>
  )
}

const SEARCH_BAR_FALLBACK = (
  <div
    className="w-full"
    style={{ height: '40px', borderRadius: '100px', background: 'rgba(255,255,255,0.85)', border: '1.5px solid #E8E9EA' }}
  />
)

function LoggedOutActions() {
  return (
    <div className="flex items-center gap-4">
      <Link
        href="/how-it-works"
        className="hidden sm:block text-sm font-medium transition-colors"
        style={{ color: '#4A4D52' }}
        onMouseEnter={e => (e.currentTarget.style.color = '#1A1D20')}
        onMouseLeave={e => (e.currentTarget.style.color = '#4A4D52')}
      >
        Sell With Us
      </Link>
      <Link
        href="/auth/login"
        className="px-4 py-1.5 text-sm font-bold text-white bg-orange rounded-pill hover:bg-orange-lt transition-colors"
        style={{ boxShadow: '0 4px 16px rgba(255,107,53,0.30)' }}
      >
        Sign In
      </Link>
    </div>
  )
}

export default function Navbar() {
  const pathname = usePathname()
  const isHomepage = pathname === '/'
  const { authUser } = useAuth()

  const [searchTakeoverOpen, setSearchTakeoverOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const searchTakeoverRef = useRef<MobileSearchTakeoverHandle>(null)

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
      <div className="max-w-[1450px] mx-auto h-full">
        <div
          className="hidden lg:grid items-center h-full page-shell-x"
          style={{ gridTemplateColumns: 'auto 1fr auto', gap: '24px' }}
        >
          <Logo />
          <div className="flex justify-center">
            <div className="w-full max-w-[440px]">
              <Suspense fallback={SEARCH_BAR_FALLBACK}>
                <SearchBar variant="nav" />
              </Suspense>
            </div>
          </div>
          {authUser ? <ProfileDropdown user={authUser} /> : <LoggedOutActions />}
        </div>

        <div className="flex lg:hidden items-center h-full px-3 gap-2">
          {isHomepage ? (
            <>
              <Logo />
              <div className="flex-1" />
              <button
                onClick={openSearchTakeover}
                aria-label="Search"
                className={`${TAP_TARGET} text-ink-2 hover:text-ink transition-colors`}
                style={TAP_SIZE}
              >
                <SearchIcon />
              </button>
            </>
          ) : (
            <>
              <LogoIcon />
              <SearchBarTrigger onClick={openSearchTakeover} />
            </>
          )}
          <MobileNavTrigger user={authUser} onClick={openMobileMenu} />
        </div>
      </div>

      <MobileMenu open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} user={authUser} />
      <MobileSearchTakeover
        ref={searchTakeoverRef}
        open={searchTakeoverOpen}
        onClose={() => setSearchTakeoverOpen(false)}
      />
    </header>
  )
}
