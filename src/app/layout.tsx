import type { Metadata, Viewport } from 'next'
import { GoogleAnalytics } from '@next/third-parties/google'
import { Inter } from 'next/font/google'
import FeedbackWidget from '@/components/feedback/FeedbackWidget'
import {
  COMPANY,
  companyTelephone,
  socialUrls,
} from '@/lib/companyInfo'
import { PUBLIC_SITE_URL } from '@/lib/site'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
})

function organizationJsonLd(): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Black Diamond Marketplace',
    url: PUBLIC_SITE_URL,
    logo: `${PUBLIC_SITE_URL}/bd_logo-icon.svg`,
    description: 'Black Diamond Marketplace is building the best way to buy and sell heavy equipment.',
  }

  const sameAs = socialUrls()
  if (sameAs.length > 0) schema.sameAs = sameAs
  if (COMPANY.legalName) schema.legalName = COMPANY.legalName

  const telephone = companyTelephone()
  if (telephone) schema.telephone = telephone

  const address: Record<string, string> = { '@type': 'PostalAddress' }
  if (COMPANY.streetAddress) address.streetAddress = COMPANY.streetAddress
  if (COMPANY.city) address.addressLocality = COMPANY.city
  if (COMPANY.region) address.addressRegion = COMPANY.region
  if (COMPANY.postalCode) address.postalCode = COMPANY.postalCode
  if (COMPANY.country) address.addressCountry = COMPANY.country
  if (Object.keys(address).length > 1) schema.address = address

  return schema
}

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Black Diamond Marketplace',
  url: PUBLIC_SITE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${PUBLIC_SITE_URL}/search?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  metadataBase: new URL(PUBLIC_SITE_URL),
  title: {
    default: 'Oilfield & Heavy Equipment for Sale | Black Diamond Marketplace',
    template: '%s | Black Diamond Marketplace',
  },
  description:
    'Used oilfield and heavy equipment for sale from verified sellers. Browse listings across energy, construction, mining, agriculture, and forestry.',
  keywords: [
    'heavy equipment marketplace',
    'used heavy equipment for sale',
    'oil and gas equipment',
    'construction equipment marketplace',
    'mining equipment for sale',
    'agriculture equipment',
    'forestry equipment',
    'industrial equipment marketplace',
    'heavy equipment buyers sellers',
    'Black Diamond Marketplace',
  ],
  authors: [{ name: 'Black Diamond Marketplace', url: PUBLIC_SITE_URL }],
  creator: 'Black Diamond Marketplace',
  publisher: 'Black Diamond Marketplace',
  icons: {
    icon: [
      { url: '/bd-favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: '/bd-favicon.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: PUBLIC_SITE_URL,
    siteName: 'Black Diamond Marketplace',
    title: 'Oilfield & Heavy Equipment for Sale | Black Diamond Marketplace',
    description:
      'Used oilfield and heavy equipment for sale from verified sellers across energy, construction, mining, agriculture, and forestry.',
    images: [
      {
        url: '/main-share-img.png',
        width: 1200,
        height: 630,
        alt: 'Black Diamond Marketplace — Machinery Deals Made Easy.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Oilfield & Heavy Equipment for Sale | Black Diamond Marketplace',
    description:
      'Used oilfield and heavy equipment for sale from verified sellers across energy, construction, mining, agriculture, and forestry.',
    images: ['/main-share-img.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim()

  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-bg text-ink font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        {children}
        <FeedbackWidget />
        {gaMeasurementId ? <GoogleAnalytics gaId={gaMeasurementId} /> : null}
      </body>
    </html>
  )
}
