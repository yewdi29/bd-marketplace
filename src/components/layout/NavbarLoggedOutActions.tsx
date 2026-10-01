'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/** Logged-out navbar actions. Homepage header is logo, search, and Sign in. */
export default function NavbarLoggedOutActions() {
  const pathname = usePathname()
  const isHomepage = pathname === '/'

  return (
    <div className="flex items-center gap-4">
      {!isHomepage && (
        <Link
          href="/auth/signup"
          className="hidden sm:block text-sm font-medium transition-colors hover:text-ink text-[#4A4D52]"
        >
          Sell With Us
        </Link>
      )}
      <Link
        href="/auth/login"
        prefetch={false}
        className="px-4 py-1.5 text-sm font-bold text-white bg-orange rounded-pill hover:bg-orange-lt transition-colors"
        style={{ boxShadow: '0 4px 16px rgba(255,107,53,0.30)' }}
      >
        Sign in
      </Link>
    </div>
  )
}
