'use client'

import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Button from './ui/Button'

interface NavbarProps {
  user?: { email: string } | null
}

export default function Navbar({ user }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-surface-border bg-background/90 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="font-display text-2xl tracking-widest text-gold leading-none">
              BLACK DIAMOND
            </span>
            <span className="hidden sm:block font-body text-xs text-gray-500 uppercase tracking-widest self-end mb-0.5">
              Marketplace
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/listings"
              className="font-body text-sm text-gray-400 hover:text-gold transition-colors"
            >
              Browse Equipment
            </Link>
            <Link
              href="/knowledge-base"
              className="font-body text-sm text-gray-400 hover:text-gold transition-colors"
            >
              Knowledge Base
            </Link>
          </nav>

          {/* Auth actions */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="font-body text-sm text-gray-400 hover:text-gold transition-colors"
                >
                  Dashboard
                </Link>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button variant="primary" size="sm">Get Started</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-gray-400 hover:text-gold"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-surface-border py-4 flex flex-col gap-4">
            <Link href="/listings" className="font-body text-sm text-gray-300 hover:text-gold" onClick={() => setMenuOpen(false)}>
              Browse Equipment
            </Link>
            <Link href="/knowledge-base" className="font-body text-sm text-gray-300 hover:text-gold" onClick={() => setMenuOpen(false)}>
              Knowledge Base
            </Link>
            {user ? (
              <>
                <Link href="/dashboard" className="font-body text-sm text-gray-300 hover:text-gold" onClick={() => setMenuOpen(false)}>
                  Dashboard
                </Link>
                <Button variant="outline" size="sm" onClick={handleSignOut} className="w-fit">
                  Sign Out
                </Button>
              </>
            ) : (
              <div className="flex gap-3">
                <Link href="/auth/login" onClick={() => setMenuOpen(false)}>
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link href="/auth/signup" onClick={() => setMenuOpen(false)}>
                  <Button variant="primary" size="sm">Get Started</Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
