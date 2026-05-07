'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface NavbarProps {
  user?: { email: string } | null
}

export default function Navbar({ user }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.refresh()
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <header
      className="fixed top-3 left-4 right-4 z-50"
      style={{
        borderRadius: '20px',
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
        height: '58px',
      }}
    >
      <div className="max-w-[1280px] mx-auto px-5 flex items-center justify-between h-full">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div
            className="w-7 h-7 bg-ink flex items-center justify-center shrink-0"
            style={{ borderRadius: '7px' }}
          >
            <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none">
              <path d="M8 1.5L2.5 6 8 14.5 13.5 6 8 1.5z" fill="white" />
            </svg>
          </div>
          <span className="font-sans font-bold text-sm tracking-tight text-ink">
            BLACK DIAMOND
          </span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-1">
          {[
            { label: 'Browse Equipment', href: '/listings' },
            { label: 'Knowledge Base', href: '/knowledge-base' },
          ].map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3.5 py-1.5 text-sm font-medium rounded-pill transition-all duration-150 ${
                isActive(link.href)
                  ? 'bg-white text-ink shadow-card'
                  : 'text-ink-2 hover:text-ink hover:bg-white/70'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop auth actions */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className={`px-3.5 py-1.5 text-sm font-medium rounded-pill transition-all ${
                  isActive('/dashboard')
                    ? 'bg-white text-ink shadow-card'
                    : 'text-ink-2 hover:text-ink hover:bg-white/70'
                }`}
              >
                Dashboard
              </Link>
              <button
                onClick={handleSignOut}
                className="px-4 py-1.5 text-sm font-bold text-ink-2 border border-[#D4D5D7] rounded-pill hover:border-orange hover:text-orange transition-colors"
              >
                Sign Out
              </button>
            </>
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
                className="px-4 py-1.5 text-sm font-bold text-white bg-orange rounded-pill hover:bg-orange-lt transition-colors shadow-orange-glow"
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
          className="md:hidden absolute top-full left-0 right-0 mt-1 bg-white border border-[#E8E9EA] p-4 flex flex-col gap-2"
          style={{ borderRadius: '16px', boxShadow: '0 8px 28px rgba(0,0,0,0.10)' }}
        >
          <Link href="/listings" className="px-3 py-2 text-sm font-medium text-ink-2 hover:text-ink rounded-[10px] hover:bg-bg transition-colors" onClick={() => setMenuOpen(false)}>
            Browse Equipment
          </Link>
          <Link href="/knowledge-base" className="px-3 py-2 text-sm font-medium text-ink-2 hover:text-ink rounded-[10px] hover:bg-bg transition-colors" onClick={() => setMenuOpen(false)}>
            Knowledge Base
          </Link>
          <div className="border-t border-[#E8E9EA] my-1" />
          {user ? (
            <>
              <Link href="/dashboard" className="px-3 py-2 text-sm font-medium text-ink-2 hover:text-ink rounded-[10px] hover:bg-bg transition-colors" onClick={() => setMenuOpen(false)}>
                Dashboard
              </Link>
              <button onClick={() => { handleSignOut(); setMenuOpen(false) }} className="px-4 py-2 text-sm font-bold text-ink border border-[#D4D5D7] rounded-pill text-left">
                Sign Out
              </button>
            </>
          ) : (
            <div className="flex gap-2">
              <Link href="/auth/login" onClick={() => setMenuOpen(false)} className="flex-1 px-4 py-2 text-sm font-bold text-center text-ink border border-[#D4D5D7] rounded-pill hover:border-orange hover:text-orange transition-colors">
                Sign In
              </Link>
              <Link href="/auth/signup" onClick={() => setMenuOpen(false)} className="flex-1 px-4 py-2 text-sm font-bold text-center text-white bg-orange rounded-pill hover:bg-orange-lt transition-colors">
                List Equipment
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
