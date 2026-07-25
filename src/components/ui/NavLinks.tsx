'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Single source of truth for nav link labels and destinations.
// To add, remove, or rename a link — edit here only.
export const NAV_LINK_DEFS = (_isSignedIn: boolean) => [
  { label: 'Browse Equipment', href: '/search' },
  { label: 'The Operator Journal', href: '/journal' },
  { label: 'How It Works', href: '/how-it-works' },
]

interface NavLinksProps {
  isSignedIn: boolean
  /**
   * 'public'    — Navbar.tsx: pill active state, lighter hover
   * 'dashboard' — DashboardNav.tsx: plain text, no active pill
   */
  variant: 'public' | 'dashboard'
  onNavigate?: () => void
}

export default function NavLinks({ isSignedIn, variant, onNavigate }: NavLinksProps) {
  const pathname = usePathname()
  const links = NAV_LINK_DEFS(isSignedIn)

  if (variant === 'dashboard') {
    return (
      <>
        {links.map(link => (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className="text-sm font-medium text-ink-2 hover:text-ink transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </>
    )
  }

  // public variant — active pill highlight
  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <>
      {links.map(link => (
        <Link
          key={link.href}
          href={link.href}
          onClick={onNavigate}
          className={`px-3.5 py-1.5 text-sm font-medium rounded-pill transition-all duration-150 ${
            isActive(link.href)
              ? 'bg-white text-ink shadow-card'
              : 'text-ink-2 hover:text-ink hover:bg-white/70'
          }`}
        >
          {link.label}
        </Link>
      ))}
    </>
  )
}
