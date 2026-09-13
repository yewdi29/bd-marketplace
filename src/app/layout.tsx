import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { GoogleAnalytics } from '@next/third-parties/google'
import { Inter } from 'next/font/google'
import FeedbackWidget from '@/components/feedback/FeedbackWidget'
import { PUBLIC_SITE_URL } from '@/lib/site'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
})

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Black Diamond Marketplace',
  url: PUBLIC_SITE_URL,
  logo: `${PUBLIC_SITE_URL}/bd_logo-icon.svg`,
  description: "The World's Heavy Equipment Marketplace",
  sameAs: [],
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
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
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
        alt: "Black Diamond Marketplace — The World's Heavy Equipment Marketplace",
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
        <Script
          id="schema-organization"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <Script
          id="schema-website"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        {children}
        <FeedbackWidget />
        {gaMeasurementId ? <GoogleAnalytics gaId={gaMeasurementId} /> : null}
      </body>
    </html>
  )
}
