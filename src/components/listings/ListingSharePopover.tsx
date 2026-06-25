'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  cloneElement,
  isValidElement,
  type ReactElement,
  type CSSProperties,
} from 'react'
import { createPortal } from 'react-dom'

export interface ListingShareData {
  listingUrl: string
  listingTitle: string
  listingPrice?: string
  listingLocation?: string | null
}

interface ShareOption {
  key: string
  label: string
  icon: React.ReactNode
  href?: string
  onClick?: () => void
}

// ─── Icons ────────────────────────────────────────────────────────────────────

export function ShareIcon({
  className = 'w-4 h-4 shrink-0',
  stroke = '#4A4D52',
}: {
  className?: string
  stroke?: string
}) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke={stroke} strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 00-6 6v3" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4 shrink-0 text-[#1A5C18]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

function LinkIcon() {
  return (
    <svg className="w-4 h-4 shrink-0 text-ink-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 010 5.656l-3 3a4 4 0 01-5.656-5.656l1.5-1.5M10.172 13.828a4 4 0 010-5.656l3-3a4 4 0 015.656 5.656l-1.5 1.5" />
    </svg>
  )
}

function EmailIcon() {
  return (
    <svg className="w-4 h-4 shrink-0 text-ink-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

function MessengerIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="#0084FF">
      <path d="M12 2C6.477 2 2 6.145 2 11.243c0 2.91 1.454 5.506 3.726 7.205V22l3.405-1.869c.909.252 1.871.388 2.869.388 5.523 0 10-4.145 10-9.276C22 6.145 17.523 2 12 2zm1.005 12.49l-2.547-2.717-4.97 2.717 5.467-5.797 2.609 2.717 4.908-2.717-5.467 5.797z" />
    </svg>
  )
}

function WhatsAppIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="#25D366">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 004.74 1.21h.01c5.46 0 9.9-4.45 9.9-9.91C21.95 6.45 17.5 2 12.04 2zm5.8 14.16c-.24.68-1.4 1.3-1.93 1.38-.49.08-1.11.11-1.79-.11-.41-.13-.94-.3-1.62-.6-2.85-1.23-4.71-4.1-4.85-4.29-.14-.19-1.16-1.54-1.16-2.94 0-1.4.73-2.08 1-2.37.27-.29.58-.36.78-.36.19 0 .39 0 .56.01.18.01.42-.07.65.5.24.58.82 2 .89 2.15.07.15.12.32.02.51-.1.19-.15.31-.3.48-.15.17-.31.38-.45.51-.15.14-.3.3-.13.59.17.29.76 1.25 1.63 2.03 1.12 1 2.06 1.31 2.35 1.46.29.15.46.13.63-.05.17-.18.72-.84.92-1.13.19-.29.39-.24.65-.14.27.1 1.69.8 1.98.94.29.15.48.22.55.34.07.13.07.74-.17 1.42z" />
    </svg>
  )
}

function LinkedInIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="#0A66C2">
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 11.01-4.12 2.06 2.06 0 01-.01 4.12zM7.12 20.45H3.56V9h3.56v11.45z" />
    </svg>
  )
}

// ─── Share options ────────────────────────────────────────────────────────────

export function useListingShareOptions({
  listingUrl,
  listingTitle,
  listingPrice = '',
  listingLocation = null,
}: ListingShareData) {
  const [copied, setCopied] = useState(false)

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(listingUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard not available — fail silently
    }
  }, [listingUrl])

  const emailSubject = encodeURIComponent(`Black Diamond Marketplace — ${listingTitle}`)
  const emailBody = encodeURIComponent(
    `${listingTitle}\n${listingPrice}${listingLocation ? `\n${listingLocation}` : ''}\n\n${listingUrl}`
  )
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(listingUrl)}&quote=${encodeURIComponent('Check out this equipment listing on Black Diamond Marketplace')}`
  // NOTE: app_id is a placeholder — replace with a real Facebook App ID before launch.
  const messengerUrl = `https://www.facebook.com/dialog/send?link=${encodeURIComponent(listingUrl)}&app_id=PLACEHOLDER_APP_ID&redirect_uri=${encodeURIComponent(listingUrl)}`
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${listingTitle} ${listingUrl}`)}`
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(listingUrl)}&text=${encodeURIComponent('Available on Black Diamond Marketplace')}`

  const shareOptions: ShareOption[] = [
    {
      key: 'copy',
      label: copied ? 'Copied' : 'Copy Link',
      icon: copied ? <CheckIcon /> : <LinkIcon />,
      onClick: handleCopyLink,
    },
    {
      key: 'email',
      label: 'Email',
      icon: <EmailIcon />,
      href: `mailto:?subject=${emailSubject}&body=${emailBody}`,
    },
    {
      key: 'facebook',
      label: 'Facebook',
      icon: <FacebookIcon />,
      href: facebookUrl,
    },
    {
      key: 'messenger',
      label: 'Messenger',
      icon: <MessengerIcon />,
      href: messengerUrl,
    },
    {
      key: 'whatsapp',
      label: 'WhatsApp',
      icon: <WhatsAppIcon />,
      href: whatsappUrl,
    },
    {
      key: 'linkedin',
      label: 'LinkedIn',
      icon: <LinkedInIcon />,
      href: linkedInUrl,
    },
  ]

  return { shareOptions, copied }
}

// ─── Popover panel ────────────────────────────────────────────────────────────

export function SharePopoverPanel({
  shareOptions,
  onSelect,
  align = 'right',
  style,
  className = '',
}: {
  shareOptions: ShareOption[]
  onSelect?: () => void
  align?: 'left' | 'right'
  style?: CSSProperties
  className?: string
}) {
  return (
    <div
      className={`${align === 'right' ? 'right-0' : 'left-0'} mt-2 bg-white rounded-[16px] border border-[#E8E9EA] overflow-hidden z-30 ${className}`.trim()}
      style={{ width: '200px', boxShadow: '0 8px 28px rgba(0,0,0,0.12)', ...style }}
    >
      {shareOptions.map(opt =>
        opt.href ? (
          <a
            key={opt.key}
            href={opt.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onSelect}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-sans text-ink-2 hover:text-ink hover:bg-bg transition-colors"
          >
            {opt.icon}
            {opt.label}
          </a>
        ) : (
          <button
            key={opt.key}
            type="button"
            onClick={() => {
              opt.onClick?.()
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-sans text-ink-2 hover:text-ink hover:bg-bg transition-colors text-left"
          >
            {opt.icon}
            {opt.label}
          </button>
        )
      )}
    </div>
  )
}

// ─── Card-style trigger wrapper ───────────────────────────────────────────────

interface ListingSharePopoverProps extends ListingShareData {
  trigger: ReactElement<{ onClick?: (e: React.MouseEvent) => void }>
  className?: string
}

export function ListingSharePopover({
  trigger,
  className = '',
  ...shareData
}: ListingSharePopoverProps) {
  const [open, setOpen] = useState(false)
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({})
  const anchorRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const { shareOptions } = useListingShareOptions(shareData)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      if (
        anchorRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return
      }
      setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  useEffect(() => {
    if (!open || !anchorRef.current) return

    function updatePosition() {
      if (!anchorRef.current) return
      const rect = anchorRef.current.getBoundingClientRect()
      setPanelStyle({
        position: 'fixed',
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      })
    }

    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [open])

  if (!isValidElement(trigger)) return null

  const triggerWithHandler = cloneElement(trigger, {
    onClick: (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      trigger.props.onClick?.(e)
      setOpen(o => !o)
    },
  })

  const panel = open ? (
    <div ref={panelRef}>
      <SharePopoverPanel
        shareOptions={shareOptions}
        onSelect={() => setOpen(false)}
        style={panelStyle}
        className="absolute"
      />
    </div>
  ) : null

  return (
    <div className={`relative ${className}`.trim()} ref={anchorRef}>
      {triggerWithHandler}
      {panel && typeof document !== 'undefined' ? createPortal(panel, document.body) : null}
    </div>
  )
}
