'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { CreditCard, LogOut, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  getInitials,
  PROFILE_COMPANY_SETTINGS_LINK,
  PROFILE_MENU_LINKS,
  ProfileMenuIcon,
  type ProfileUser,
} from '@/components/ui/ProfileDropdown'
import { navLinkPrefetch } from '@/lib/navLink'
import PlanBadge, { EnterpriseBadge } from '@/components/ui/PlanBadge'
import { trapFocus } from '@/lib/focusTrap'

// Primary navigation links — always shown, regardless of auth state
const NAV_LINKS = [
  { label: 'Search', href: '/search' },
  { label: 'The Operator Journal', href: '/journal' },
  { label: 'About', href: '/about' },
]

function CloseIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

// Shared row styling — 44px minimum tap target
const ROW = 'flex items-center text-[15px] text-ink-2 hover:text-ink transition-colors'

interface MobileMenuProps {
  open: boolean
  onClose: () => void
  user: ProfileUser | null
  /** Hamburger / avatar trigger — focus returns here when the menu closes. */
  triggerRef?: RefObject<HTMLElement | null>
}

export default function MobileMenu({ open, onClose, user, triggerRef }: MobileMenuProps) {
  const router = useRouter()
  const [toast, setToast] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // When closed: inert removes panel + descendants from tab order and assistive tech.
  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return

    if (open) {
      panel.removeAttribute('inert')
    } else {
      panel.setAttribute('inert', '')
    }
  }, [open])

  // Lock background scroll, Escape to close, focus trap while open
  useEffect(() => {
    if (!open) return

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    closeButtonRef.current?.focus()

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (panelRef.current) trapFocus(panelRef.current, e)
    }
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  // Return focus to the menu trigger when the drawer closes
  const wasOpenRef = useRef(open)
  useEffect(() => {
    if (wasOpenRef.current && !open) {
      triggerRef?.current?.focus()
    }
    wasOpenRef.current = open
  }, [open, triggerRef])

  async function handleSignOut() {
    onClose()
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  function handleManageSubscription() {
    onClose()
    if (user?.plan === 'max') {
      setToast('Billing management coming soon.')
      setTimeout(() => setToast(null), 4000)
    } else {
      router.push('/dashboard/upgrade')
    }
  }

  const overlay = (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-[100] transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}
      />

      {/* Slide-in panel — min(75%, 400px) wide at every size below 1024px */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        aria-hidden={!open}
        className={[
          'fixed inset-y-0 right-0 bg-white flex flex-col z-[110] transition-transform duration-300',
          'border-l border-[#E8E9EA] shadow-[-8px_0_32px_rgba(0,0,0,0.10)]',
          open ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
        style={{ width: 'min(75vw, 400px)' }}
      >
        {/* Close button */}
        <div className="flex justify-end shrink-0 px-2 pt-2">
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close menu"
            className="flex items-center justify-center text-ink-2 hover:text-ink transition-colors"
            style={{ width: 44, height: 44 }}
          >
            <CloseIcon />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          {user ? (
            <>
              {/* Profile header */}
              <div className="flex items-center gap-3 pb-4 mb-2 border-b border-[#E8E9EA]">
                <div className="w-9 h-9 rounded-full bg-orange flex items-center justify-center shrink-0">
                  <span className="text-white text-sm font-bold leading-none">
                    {getInitials(user.full_name, user.email)}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{user.full_name ?? user.email}</p>
                  <div className="mt-1">
                    {user.has_organization ? (
                      <EnterpriseBadge />
                    ) : (
                      <PlanBadge plan={user.plan} />
                    )}
                  </div>
                </div>
              </div>

              {/* Profile links */}
              <div className="flex flex-col">
                {PROFILE_MENU_LINKS.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={navLinkPrefetch(item.href)}
                    onClick={onClose}
                    className={`${ROW} gap-2.5 border-b border-[#F0F0F0]`}
                    style={{ minHeight: 44 }}
                  >
                    <ProfileMenuIcon icon={item.icon} />
                    {item.label}
                  </Link>
                ))}

                {user.has_organization && (
                  <Link
                    href={PROFILE_COMPANY_SETTINGS_LINK.href}
                    prefetch={navLinkPrefetch(PROFILE_COMPANY_SETTINGS_LINK.href)}
                    onClick={onClose}
                    className={`${ROW} gap-2.5 border-b border-[#F0F0F0]`}
                    style={{ minHeight: 44 }}
                  >
                    <ProfileMenuIcon icon={PROFILE_COMPANY_SETTINGS_LINK.icon} />
                    {PROFILE_COMPANY_SETTINGS_LINK.label}
                  </Link>
                )}

                {!user.has_organization && (
                <button
                  type="button"
                  onClick={handleManageSubscription}
                  className={`${ROW} gap-2.5 border-b border-[#F0F0F0] w-full`}
                  style={{ minHeight: 44 }}
                >
                  <ProfileMenuIcon icon={user.plan === 'max' ? CreditCard : Sparkles} />
                  {user.plan === 'max' ? 'Manage Billing' : 'Upgrade Plan'}
                </button>
                )}
                <button
                  type="button"
                  onClick={handleSignOut}
                  className={`${ROW} gap-2.5 text-ink-3 w-full`}
                  style={{ minHeight: 44 }}
                >
                  <ProfileMenuIcon icon={LogOut} />
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-3 pb-5 mb-2 border-b border-[#E8E9EA]">
              <Link
                href="/auth/signup"
                onClick={onClose}
                className="flex items-center text-sm font-medium text-ink-2 hover:text-ink transition-colors"
                style={{ minHeight: 44 }}
              >
                Sell With Us
              </Link>
              <Link
                href="/auth/login"
                prefetch={false}
                onClick={onClose}
                className="flex items-center justify-center text-sm font-bold text-white bg-orange rounded-pill hover:bg-orange-lt transition-colors"
                style={{ minHeight: 44, boxShadow: '0 4px 16px rgba(255,107,53,0.30)' }}
              >
                Sign In
              </Link>
            </div>
          )}

          {/* Primary nav links */}
          <div className="flex flex-col mt-3">
            {NAV_LINKS.map(item => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={ROW}
                style={{ minHeight: 44 }}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  )

  return (
    <>
      {mounted && createPortal(overlay, document.body)}

      {/* Toast (for max plan "coming soon") */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[120] pointer-events-none">
          <div
            className="flex items-center gap-2 bg-ink text-white text-sm font-sans px-5 py-3 rounded-pill"
            style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.25)' }}
          >
            <svg className="w-4 h-4 shrink-0 text-[#A2FF9A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {toast}
          </div>
        </div>
      )}
    </>
  )
}
