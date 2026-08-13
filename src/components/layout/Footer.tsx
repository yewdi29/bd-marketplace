'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import SellerPortalLink from '@/components/SellerPortalLink'

const FOOTER_LINK_CLASS =
  'font-sans text-white/55 hover:text-white/90 transition-colors'

const LEGAL_LINK_CLASS =
  'font-sans text-white/35 hover:text-white/60 hover:underline transition-colors'

const SITEMAP = [
  {
    heading: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
      { label: 'Careers', href: '/careers' },
      { label: 'Pricing', href: '/pricing' },
    ],
  },
  {
    heading: 'Categories',
    links: [
      { label: 'Oil & Gas', href: '/search?industry=oil_gas' },
      { label: 'Construction', href: '/search?industry=construction' },
      { label: 'Mining', href: '/search?industry=mining' },
      { label: 'Agriculture', href: '/search?industry=agriculture' },
      { label: 'Trucks & Trailers', href: '/search?industry=trucks_trailers' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: 'How It Works', href: '/how-it-works' },
      { label: 'List Your Equipment', sellerPortal: true },
      { label: 'Become a Seller', sellerPortal: true },
      { label: 'Business Directory', href: '/sellers' },
      { label: 'The Operator Journal', href: '/journal' },
    ],
  },
] as const

type FooterLink =
  | { label: string; href: string; sellerPortal?: false }
  | { label: string; sellerPortal: true; href?: undefined }

function IconInstagram() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/>
    </svg>
  )
}

function IconLinkedin() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
      <rect x="2" y="9" width="4" height="12"/>
      <circle cx="4" cy="4" r="2"/>
    </svg>
  )
}

function IconFacebook() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  )
}

function IconX() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  )
}

function DiamondMark() {
  return (
    <Image
      src="/bd_logo-icon.svg"
      alt=""
      width={20}
      height={17}
      className="shrink-0"
      style={{ width: 20, height: 'auto', filter: 'brightness(0) invert(1)' }}
      aria-hidden
    />
  )
}

const SOCIALS = [
  { label: 'Instagram', icon: <IconInstagram /> },
  { label: 'LinkedIn',  icon: <IconLinkedin />  },
  { label: 'Facebook',  icon: <IconFacebook />  },
  { label: 'X',         icon: <IconX />         },
]

function FooterNavLink({ link }: { link: FooterLink }) {
  const style = { fontSize: '13px' }

  if ('sellerPortal' in link && link.sellerPortal) {
    return (
      <SellerPortalLink className={FOOTER_LINK_CLASS} style={style}>
        {link.label}
      </SellerPortalLink>
    )
  }

  return (
    <Link href={link.href} className={FOOTER_LINK_CLASS} style={style}>
      {link.label}
    </Link>
  )
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h3
      className="font-mono font-bold uppercase mb-4"
      style={{ fontSize: '10px', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)' }}
    >
      {children}
    </h3>
  )
}

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="overflow-hidden" style={{ background: '#1A1D20' }}>
      <div className="page-shell pt-14 pb-0">

        {/* Top row: rights (left) + link columns (right) */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-10 lg:gap-16 pb-10">

          {/* All rights reserved — left, in line with link sections */}
          <div className="flex flex-col items-start gap-4 text-left shrink-0 lg:max-w-[280px]">
            <div className="flex flex-wrap items-center gap-3">
              <DiamondMark />
              <p
                className="font-sans m-0"
                style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}
              >
                &copy; {year} Black Diamond Marketplace. All rights reserved.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/privacy" className={LEGAL_LINK_CLASS} style={{ fontSize: '12px' }}>
                Privacy Policy
              </Link>
              <span
                aria-hidden
                style={{
                  width: 1,
                  height: 12,
                  background: 'rgba(255,255,255,0.2)',
                }}
              />
              <Link href="/terms" className={LEGAL_LINK_CLASS} style={{ fontSize: '12px' }}>
                Terms of Service
              </Link>
            </div>
          </div>

          {/* Link sections + Follow us — floated right */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 lg:ml-auto w-full lg:w-auto lg:min-w-0 lg:max-w-[860px]">
            {SITEMAP.map(col => (
              <div key={col.heading}>
                <SectionHeading>{col.heading}</SectionHeading>
                <ul className="space-y-2.5">
                  {col.links.map(link => (
                    <li key={link.label}>
                      <FooterNavLink link={link} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div>
              <SectionHeading>Follow us</SectionHeading>
              <div className="flex items-center gap-4">
                {SOCIALS.map(social => (
                  <a
                    key={social.label}
                    href="#"
                    aria-label={social.label}
                    className="text-white/35 hover:text-white/80 transition-colors"
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom rule with vertical margins, then peeking wordmark */}
        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,0.08)',
            marginTop: 24,
            marginBottom: 24,
          }}
        />

        {/* Peeking full logo with diamond — slightly more than half revealed */}
        <div
          className="relative w-full overflow-hidden pointer-events-none select-none"
          aria-hidden
          style={{ aspectRatio: '244 / 18' }}
        >
          <Image
            src="/bd_logo-black.svg"
            alt=""
            width={244}
            height={29}
            className="absolute left-0 bottom-0 w-full h-auto max-w-none"
            style={{
              opacity: 0.06,
              filter: 'brightness(0) invert(1)',
              transform: 'translateY(38%)',
            }}
          />
        </div>

      </div>
    </footer>
  )
}
