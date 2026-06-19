import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: {
    default: 'Black Diamond Marketplace | Oil & Gas Heavy Equipment',
    template: '%s | Black Diamond Marketplace',
  },
  description: 'Buy and sell heavy oil & gas equipment. Drill pipe, rigs, blowout preventers, and more. Verified listings with expert broker support.',
  keywords: ['oil and gas equipment', 'drill pipe', 'oilfield equipment', 'heavy equipment marketplace', 'rig sales'],
  openGraph: {
    type: 'website',
    siteName: 'Black Diamond Marketplace',
    title: 'Black Diamond Marketplace | Oil & Gas Heavy Equipment',
    description: 'Buy and sell heavy oil & gas equipment. Verified listings with expert broker support.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-bg text-ink font-sans">
        {children}
      </body>
    </html>
  )
}
