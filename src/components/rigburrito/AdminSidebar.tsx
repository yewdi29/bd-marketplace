'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Package,
  DollarSign,
  BarChart3,
  BookOpen,
  Tags,
  Mail,
  Handshake,
  ExternalLink,
  LogOut,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import DiamondLogo from './DiamondLogo'

const NAV_ITEMS = [
  { href: '/rigburrito', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/rigburrito/users', label: 'Users', icon: Users },
  { href: '/rigburrito/listings', label: 'Listings', icon: Package },
  { href: '/rigburrito/revenue', label: 'Revenue', icon: DollarSign },
  { href: '/rigburrito/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/rigburrito/journal', label: 'Journal', icon: BookOpen },
  { href: '/rigburrito/taxonomy', label: 'Taxonomy', icon: Tags },
  { href: '/rigburrito/newsletter', label: 'Newsletter', icon: Mail },
  { href: '/rigburrito/deals', label: 'Deals', icon: Handshake },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/rigburrito/login')
    router.refresh()
  }

  return (
    <aside className="rigburrito-sidebar">
      <div className="rigburrito-sidebar-logo">
        <DiamondLogo />
        <p className="rigburrito-sidebar-wordmark">Black Diamond</p>
        <p className="rigburrito-sidebar-subtitle">Command Center</p>
      </div>

      <p className="rigburrito-sidebar-nav-label">Main</p>
      <nav className="flex-1 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rigburrito-sidebar-nav-item${active ? ' rigburrito-sidebar-nav-item--active' : ''}`}
            >
              <Icon size={16} strokeWidth={2} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="rigburrito-sidebar-bottom">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="rigburrito-sidebar-bottom-link"
        >
          <ExternalLink size={16} />
          Back to Site
        </a>
        <button type="button" onClick={handleSignOut} className="rigburrito-sidebar-bottom-link">
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
