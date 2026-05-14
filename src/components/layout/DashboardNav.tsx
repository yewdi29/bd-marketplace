'use client'

import Link from 'next/link' // used for logo only
import ProfileDropdown, { type ProfileUser } from '@/components/ui/ProfileDropdown'
import NavLinks from '@/components/ui/NavLinks'

export default function DashboardNav({ user }: { user: ProfileUser }) {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 border-b border-[#E8E9EA]"
      style={{
        height: '56px',
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div className="max-w-[1280px] mx-auto px-6 flex items-center justify-between h-full">

        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 bg-ink flex items-center justify-center shrink-0" style={{ borderRadius: '7px' }}>
            <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none">
              <path d="M8 1.5L2.5 6 8 14.5 13.5 6 8 1.5z" fill="white" />
            </svg>
          </div>
          <span className="font-sans font-bold text-sm tracking-tight text-ink">BLACK DIAMOND</span>
        </Link>

        {/* Center: Nav links */}
        <nav className="flex items-center gap-6">
          <NavLinks isSignedIn={true} variant="dashboard" />
        </nav>

        {/* Right: Profile */}
        <ProfileDropdown user={user} />
      </div>
    </header>
  )
}
