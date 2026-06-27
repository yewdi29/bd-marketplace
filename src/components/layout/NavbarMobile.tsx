'use client'

import { useState, useRef, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import MobileMenu from '@/components/layout/MobileMenu'
import MobileSearchTakeover, { type MobileSearchTakeoverHandle } from '@/components/layout/MobileSearchTakeover'
import {
  LogoIcon,
  SearchIcon,
  SearchBarTrigger,
  MobileNavTrigger,
  TAP_TARGET,
  TAP_SIZE,
} from '@/components/layout/MobileNavParts'

export default function NavbarMobile({
  homepageLogo,
}: {
  homepageLogo: ReactNode
}) {
  const pathname = usePathname()
  const isHomepage = pathname === '/'
  const { authUser } = useAuth()

  const [searchTakeoverOpen, setSearchTakeoverOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const searchTakeoverRef = useRef<MobileSearchTakeoverHandle>(null)

  function openSearchTakeover() {
    setMobileMenuOpen(false)
    flushSync(() => setSearchTakeoverOpen(true))
    searchTakeoverRef.current?.focusInput()
  }

  function openMobileMenu() {
    setSearchTakeoverOpen(false)
    setMobileMenuOpen(true)
  }

  return (
    <>
      <div className="flex lg:hidden items-center h-full px-3 gap-2">
        {isHomepage ? (
          <>
            {homepageLogo}
            <div className="flex-1" />
            <button
              onClick={openSearchTakeover}
              aria-label="Search"
              className={`${TAP_TARGET} text-ink-2 hover:text-ink transition-colors`}
              style={TAP_SIZE}
            >
              <SearchIcon />
            </button>
          </>
        ) : (
          <>
            <LogoIcon />
            <SearchBarTrigger onClick={openSearchTakeover} />
          </>
        )}
        <MobileNavTrigger user={authUser} onClick={openMobileMenu} />
      </div>

      <MobileMenu open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} user={authUser} />
      <MobileSearchTakeover
        ref={searchTakeoverRef}
        open={searchTakeoverOpen}
        onClose={() => setSearchTakeoverOpen(false)}
      />
    </>
  )
}
