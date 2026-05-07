import type { Metadata } from 'next'
import './globals.css'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const navUser = user?.email ? { email: user.email } : null

  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-bg text-ink">
        <Navbar user={navUser} />
        <main className="flex-1 pt-[82px]">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
