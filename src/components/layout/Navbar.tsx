'use client'

import Link from 'next/link'
import { useState, useEffect, Suspense } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ProfileDropdown, { type ProfileUser } from '@/components/ui/ProfileDropdown'
import SearchBar from '@/components/marketplace/SearchBar'

// ─── Logo ─────────────────────────────────────────────────────────────────────

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 shrink-0">
      <div
        className="w-7 h-7 bg-ink flex items-center justify-center shrink-0"
        style={{ borderRadius: '7px' }}
      >
        <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none">
          <path d="M8 1.5L2.5 6 8 14.5 13.5 6 8 1.5z" fill="white" />
        </svg>
      </div>
      <span className="font-sans font-bold text-sm tracking-tight text-ink">BLACK DIAMOND</span>
    </Link>
  )
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

export default function Navbar() {
  const [authUser, setAuthUser] = useState<ProfileUser | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const pathname = usePathname()
  const isHomepage = pathname === '/'

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

    // onAuthStateChange fires immediately with the current session,
    // so the navbar updates synchronously on login/logout without a flash.
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

  // ── Right-side content — changes based on page + auth state ─────────────────

  function RightContent() {
    // Don't render auth-sensitive UI until we know auth state
    // (avoids a logged-in flash of Sign In buttons on page load)
    if (!authReady) return null

    if (authUser) {
      return <ProfileDropdown user={authUser} />
    }

    // Logged out — same on homepage and other pages
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/auth/signup"
          className="hidden sm:block text-sm font-medium text-ink-2 hover:text-ink transition-colors"
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
        background: 'rgba(255,255,255,0.55)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(232,233,234,0.4)',
        height: '58px',
      }}
    >
      {/*
       * 3-column grid: Logo | Center | Right
       *
       * Homepage:     logo | (empty) | Sell With Us + Sign In  OR  Profile
       * Other pages:  logo | SearchBar | Sell With Us + Sign In  OR  Profile
       *
       * The center column is always present so the logo stays left-anchored
       * and the right content stays right-anchored regardless of content.
       */}
      <div
        className="max-w-[1232px] mx-auto px-8 h-full grid items-center"
        style={{ gridTemplateColumns: 'auto 1fr auto', gap: '16px' }}
      >
        {/* Col 1: Logo */}
        <Logo />

        {/* Col 2: SearchBar — only on non-homepage, desktop only.
         * Wrapped in Suspense because SearchBar uses useSearchParams()
         * to sync with ?q= on the /listings page. */}
        <div className="flex justify-center">
          {!isHomepage && (
            <div className="hidden md:block w-full max-w-[50%]">
              <Suspense fallback={
                <div
                  className="w-full"
                  style={{ height: '40px', borderRadius: '100px', background: 'rgba(255,255,255,0.85)', border: '1.5px solid #E8E9EA' }}
                />
              }>
                <SearchBar variant="nav" />
              </Suspense>
            </div>
          )}
        </div>

        {/* Col 3: Auth content */}
        <RightContent />
      </div>
    </header>
  )
}
