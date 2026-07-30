'use client'

import { useCallback, useEffect, useState } from 'react'
import { useIsMobileGallery } from './useIsMobileGallery'

const CONTACT_SECTION_ID = 'contact-seller'
const INITIAL_DELAY_MS = 1250
const SCROLL_TOP_OFFSET_PX = 20

interface Props {
  /** When false (e.g. sold listing), the button is not rendered. */
  enabled?: boolean
}

export default function MessageSellerStickyButton({ enabled = true }: Props) {
  const isMobile = useIsMobileGallery()
  const [delayComplete, setDelayComplete] = useState(false)
  const [contactInView, setContactInView] = useState(false)
  const [hideForScroll, setHideForScroll] = useState(false)
  const [mounted, setMounted] = useState(false)

  const isVisible = mounted && isMobile && enabled && delayComplete && !contactInView && !hideForScroll

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!enabled) return
    const timer = window.setTimeout(() => setDelayComplete(true), INITIAL_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [enabled])

  useEffect(() => {
    if (!enabled || !mounted) return

    const target = document.getElementById(CONTACT_SECTION_ID)
    if (!target) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setContactInView(entry.isIntersecting)
        if (entry.isIntersecting) {
          setHideForScroll(false)
        }
      },
      { threshold: 0, rootMargin: '0px 0px -8px 0px' },
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [enabled, mounted])

  const scrollToContact = useCallback(() => {
    const target = document.getElementById(CONTACT_SECTION_ID)
    if (!target) return

    const top = target.getBoundingClientRect().top + window.scrollY - SCROLL_TOP_OFFSET_PX
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
  }, [])

  const handleClick = useCallback(() => {
    setHideForScroll(true)
    scrollToContact()
  }, [scrollToContact])

  if (!enabled || !mounted || !isMobile) return null

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 lg:hidden pointer-events-none"
      aria-hidden={!isVisible}
    >
      <div
        className="page-shell pointer-events-none"
        style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
      >
        <button
          type="button"
          onClick={handleClick}
          aria-label="Message seller — scroll to contact form"
          className={`message-seller-sticky w-full py-3 text-sm font-bold text-white bg-orange rounded-pill hover:bg-orange-lt shadow-orange-glow transition-colors pointer-events-auto ${
            isVisible ? 'message-seller-sticky--visible' : 'message-seller-sticky--hidden'
          }`}
        >
          Message Seller
        </button>
      </div>
    </div>
  )
}
