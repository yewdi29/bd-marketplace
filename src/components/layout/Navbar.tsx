import Link from 'next/link'
import BrandLogo from '@/components/ui/BrandLogo'
import NavbarDesktopSearch from '@/components/layout/NavbarDesktopSearch'
import NavbarDesktopAuth from '@/components/layout/NavbarDesktopAuth'
import NavbarLoggedOutActions from '@/components/layout/NavbarLoggedOutActions'
import NavbarMobile from '@/components/layout/NavbarMobile'

function Logo() {
  return (
    <Link href="/" className="shrink-0">
      <BrandLogo priority />
    </Link>
  )
}

export default function Navbar() {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: 'rgba(255,255,255,0.20)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(232,233,234,0.30)',
        height: '64px',
      }}
    >
      <div className="max-w-[1450px] mx-auto h-full">
        <div
          className="hidden lg:grid items-center h-full page-shell-x"
          style={{ gridTemplateColumns: 'auto 1fr auto', gap: '24px' }}
        >
          <Logo />
          <NavbarDesktopSearch />
          <NavbarDesktopAuth loggedOut={<NavbarLoggedOutActions />} />
        </div>

        <NavbarMobile homepageLogo={<Logo />} />
      </div>
    </header>
  )
}
