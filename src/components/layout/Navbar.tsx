'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, Suspense } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ProfileDropdown, { type ProfileUser } from '@/components/ui/ProfileDropdown'
import SearchBar from '@/components/marketplace/SearchBar'
import MobileMenu from '@/components/layout/MobileMenu'
import MobileSearchTakeover from '@/components/layout/MobileSearchTakeover'
import { LogoIcon, SearchIcon, SearchBarTrigger, MobileNavTrigger, TAP_TARGET, TAP_SIZE } from '@/components/layout/MobileNavParts'

// ─── Logo ─────────────────────────────────────────────────────────────────────
// Homepage (mobile/tablet): full wordmark. Every other page: icon only (LogoIcon, shared).

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

// ─── Navbar ───────────────────────────────────────────────────────────────────

export default function Navbar() {
  const pathname = usePathname()
  const isHomepage = pathname === '/'

  const [authUser, setAuthUser] = useState<ProfileUser | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [searchTakeoverOpen, setSearchTakeoverOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    async function loadProfile(userId: string, email: string) {
      const [profileRes, countRes] = await Promise.all([
        supabase.from('users').select('full_name, company_name, plan').eq('id', userId).single(),
        supabase
          .from('listings')
          .select('id', { count: 'exact', head: true })
          .eq('seller_id', userId)
          .neq('status', 'removed'),
      ])
      setAuthUser({
        email,
        full_name: profileRes.data?.full_name ?? null,
        company_name: profileRes.data?.company_name ?? null,
        plan: profileRes.data?.plan ?? 'free',
        listing_count: countRes.count ?? 0,
      })
      setAuthReady(true)
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadProfile(session.user.id, session.user.email ?? '')
      } else {
        setAuthUser(null)
        setAuthReady(true)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Search takeover and the slide-in menu are mutually exclusive — opening
  // one always closes the other, so they can never visually conflict.
  function openSearchTakeover() {
    setMobileMenuOpen(false)
    setSearchTakeoverOpen(true)
  }
  function openMobileMenu() {
    setSearchTakeoverOpen(false)
    setMobileMenuOpen(true)
  }

  // ── Right-side content — desktop only, unchanged ────────────────────────────

  function RightContent() {
    if (!authReady) return null

    if (authUser) {
      return <ProfileDropdown user={authUser} />
    }

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
      <div className="max-w-[1600px] mx-auto h-full">

        {/* ── Desktop (≥1024px) — unchanged ───────────────────────────────────── */}
        <div
          className="hidden lg:grid items-center h-full px-8"
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
          <RightContent />
        </div>

        {/* ── Below 1024px — homepage vs every other page ─────────────────────── */}
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
          <MobileNavTrigger user={authUser} authReady={authReady} onClick={openMobileMenu} />
        </div>

      </div>

      <MobileMenu open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} user={authUser} />
      <MobileSearchTakeover open={searchTakeoverOpen} onClose={() => setSearchTakeoverOpen(false)} />
    </header>
  )
}
