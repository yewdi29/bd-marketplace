'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const NAV_ITEMS = [
  { label: 'Overview', href: '/dashboard' },
  { label: 'My Listings', href: '/dashboard/listings' },
  { label: 'Inquiries', href: '/dashboard/inquiries' },
  { label: 'Membership', href: '/dashboard/membership' },
  { label: 'Settings', href: '/dashboard/settings' },
]

export default function DashboardNav() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <aside className="w-[220px] shrink-0 border-r border-[#E8E9EA] bg-white min-h-screen flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#E8E9EA]">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-ink flex items-center justify-center shrink-0" style={{ borderRadius: '7px' }}>
            <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none">
              <path d="M8 1.5L2.5 6 8 14.5 13.5 6 8 1.5z" fill="white" />
            </svg>
          </div>
          <span className="font-sans font-bold text-sm tracking-tight text-ink">BLACK DIAMOND</span>
        </Link>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
        {NAV_ITEMS.map(item => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-2 text-sm font-medium rounded-[8px] transition-colors ${
                active
                  ? 'bg-bg text-ink font-semibold'
                  : 'text-ink-2 hover:text-ink hover:bg-bg'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-[#E8E9EA]">
        <button
          onClick={handleSignOut}
          className="w-full px-3 py-2 text-sm font-medium text-ink-3 hover:text-ink hover:bg-bg rounded-[8px] text-left transition-colors"
        >
          Sign Out
        </button>
      </div>
    </aside>
  )
}
