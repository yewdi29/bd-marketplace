import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { Inter } from 'next/font/google'
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
  url: 'https://blackdiamondmkt.com',
  logo: 'https://blackdiamondmkt.com/bd_logo-icon.svg',
  description: "The World's Heavy Equipment Marketplace",
  sameAs: [],
}

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Black Diamond Marketplace',
  url: 'https://blackdiamondmkt.com',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://blackdiamondmkt.com/search?q={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export const metadata: Metadata = {
  metadataBase: new URL('https://blackdiamondmkt.com'),
  title: {
    default: "Black Diamond Marketplace — The World's Heavy Equipment Marketplace",
    template: '%s | Black Diamond Marketplace',
  },
  description:
    'Black Diamond Marketplace connects verified buyers and sellers of heavy equipment across oil and gas, construction, mining, agriculture, and forestry. Source equipment locally or globally.',
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
  authors: [{ name: 'Black Diamond Marketplace', url: 'https://blackdiamondmkt.com' }],
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
    url: 'https://blackdiamondmkt.com',
    siteName: 'Black Diamond Marketplace',
    title: "Black Diamond Marketplace — The World's Heavy Equipment Marketplace",
    description:
      'Black Diamond Marketplace connects verified buyers and sellers of heavy equipment across oil and gas, construction, mining, agriculture, and forestry.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: "Black Diamond Marketplace — The World's Heavy Equipment Marketplace",
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Black Diamond Marketplace — The World's Heavy Equipment Marketplace",
    description:
      'Black Diamond Marketplace connects verified buyers and sellers of heavy equipment across oil and gas, construction, mining, agriculture, and forestry.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: 'https://blackdiamondmkt.com',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
      </body>
    </html>
  )
}
