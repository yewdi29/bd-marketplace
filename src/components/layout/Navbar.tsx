'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import ProfileDropdown, { type ProfileUser } from '@/components/ui/ProfileDropdown'
import NavLinks from '@/components/ui/NavLinks'

export default function Navbar() {
  const [authUser, setAuthUser] = useState<ProfileUser | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

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
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadProfile(session.user.id, session.user.email ?? '')
      } else {
        setAuthUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: 'rgba(255,255,255,0.55)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(232,233,234,0.6)',
        height: '58px',
      }}
    >
      <div className="max-w-[1232px] mx-auto px-8 flex items-center justify-between h-full">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 bg-ink flex items-center justify-center shrink-0" style={{ borderRadius: '7px' }}>
            <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none">
              <path d="M8 1.5L2.5 6 8 14.5 13.5 6 8 1.5z" fill="white" />
            </svg>
          </div>
          <span className="font-sans font-bold text-sm tracking-tight text-ink">BLACK DIAMOND</span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-1">
          <NavLinks isSignedIn={!!authUser} variant="public" />
        </nav>

        {/* Desktop right side */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          {authUser ? (
            <ProfileDropdown user={authUser} />
          ) : (
            <>
              <Link
                href="/auth/login"
                className="px-4 py-1.5 text-sm font-bold text-ink-2 border border-[#D4D5D7] rounded-pill hover:border-orange hover:text-orange transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="px-4 py-1.5 text-sm font-bold text-white bg-orange rounded-pill hover:bg-orange-lt transition-colors"
                style={{ boxShadow: '0 4px 16px rgba(255,107,53,0.30)' }}
              >
                List Equipment
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-1.5 text-ink-2 hover:text-ink"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {menuOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            }
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-[#E8E9EA] p-4 flex flex-col gap-2"
          style={{ boxShadow: '0 8px 28px rgba(0,0,0,0.08)' }}
        >
          <NavLinks isSignedIn={!!authUser} variant="dashboard" onNavigate={() => setMenuOpen(false)} />
          <div className="border-t border-[#E8E9EA] my-1" />
          {authUser ? (
            <Link
              href="/dashboard"
              onClick={() => setMenuOpen(false)}
              className="px-3 py-2 text-sm font-medium text-ink-2 hover:text-ink rounded-[10px] hover:bg-bg transition-colors"
            >
              My Dashboard
            </Link>
          ) : (
            <div className="flex gap-2">
              <Link
                href="/auth/login"
                onClick={() => setMenuOpen(false)}
                className="flex-1 px-4 py-2 text-sm font-bold text-center text-ink border border-[#D4D5D7] rounded-pill hover:border-orange hover:text-orange transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                onClick={() => setMenuOpen(false)}
                className="flex-1 px-4 py-2 text-sm font-bold text-center text-white bg-orange rounded-pill hover:bg-orange-lt transition-colors"
              >
                List Equipment
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
