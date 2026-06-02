'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import ProfileDropdown, { type ProfileUser } from '@/components/ui/ProfileDropdown'
import SearchBar from '@/components/marketplace/SearchBar'

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
      {/*
       * 3-column grid: Logo | SearchBar | Profile
       * Dashboard is never the homepage, so SearchBar always shows.
       */}
      <div
        className="max-w-[1280px] mx-auto px-6 h-full grid items-center"
        style={{ gridTemplateColumns: 'auto 1fr auto', gap: '16px' }}
      >
        {/* Col 1: Logo */}
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

        {/* Col 2: SearchBar — centered in remaining space.
         * Suspense required because SearchBar uses useSearchParams(). */}
        <div className="flex justify-center">
          <div className="w-full max-w-[340px]">
            <Suspense fallback={
              <div style={{ height: '40px', borderRadius: '100px', background: 'rgba(255,255,255,0.85)', border: '1.5px solid #E8E9EA' }} />
            }>
              <SearchBar variant="nav" placeholder="Search equipment..." />
            </Suspense>
          </div>
        </div>

        {/* Col 3: Profile dropdown only */}
        <ProfileDropdown user={user} />
      </div>
    </header>
  )
}
