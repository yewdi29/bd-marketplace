'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import ProfileDropdown, { type ProfileUser } from '@/components/ui/ProfileDropdown'
import SearchBar from '@/components/marketplace/SearchBar'

// ─── Logo ─────────────────────────────────────────────────────────────────────

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

// ─── Navbar ───────────────────────────────────────────────────────────────────

export default function Navbar() {
  const [authUser, setAuthUser] = useState<ProfileUser | null>(null)
  const [authReady, setAuthReady] = useState(false)

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

  // ── Right-side content ───────────────────────────────────────────────────────

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
      {/*
       * 3-column grid: Logo | SearchBar (centered) | Auth buttons
       * Search bar is visible on ALL pages — including homepage.
       */}
      <div
        className="max-w-[1232px] mx-auto px-8 h-full grid items-center"
        style={{ gridTemplateColumns: 'auto 1fr auto', gap: '24px' }}
      >
        {/* Col 1: Logo */}
        <Logo />

        {/* Col 2: SearchBar — centered, always visible on md+.
            Wrapped in Suspense because SearchBar uses useSearchParams()
            to sync with ?q= on the /listings page. */}
        <div className="flex justify-center">
          <div className="hidden md:block w-full max-w-[440px]">
            <Suspense fallback={
              <div
                className="w-full"
                style={{ height: '40px', borderRadius: '100px', background: 'rgba(255,255,255,0.85)', border: '1.5px solid #E8E9EA' }}
              />
            }>
              <SearchBar variant="nav" />
            </Suspense>
          </div>
        </div>

        {/* Col 3: Auth content */}
        <RightContent />
      </div>
    </header>
  )
}
