'use client'

import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { AuthProvider, type InitialAuth } from '@/components/providers/AuthProvider'

export default function PublicShell({
  initialAuth,
  children,
}: {
  initialAuth: InitialAuth
  children: React.ReactNode
}) {
  return (
    <AuthProvider initialAuth={initialAuth}>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-[64px]">
          {children}
        </main>
        <Footer />
      </div>
    </AuthProvider>
  )
}
