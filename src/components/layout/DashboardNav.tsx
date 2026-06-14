'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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

        {/* Col 2: SearchBar — centered in remaining space.
         * Suspense required because SearchBar uses useSearchParams(). */}
        <div className="flex justify-center">
          <div className="w-full max-w-[440px]">
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
