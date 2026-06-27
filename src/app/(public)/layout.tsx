import Footer from '@/components/layout/Footer'
import Navbar from '@/components/layout/Navbar'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { getAuthUser } from '@/lib/supabase/auth-server'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser()

  const initialAuth = user
    ? { id: user.id, email: user.email ?? '' }
    : null

  return (
    <AuthProvider initialAuth={initialAuth}>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-[64px]">{children}</main>
        <Footer />
      </div>
    </AuthProvider>
  )
}
