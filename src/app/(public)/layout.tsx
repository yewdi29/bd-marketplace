import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const navUser = user?.email ? { email: user.email } : null

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={navUser} />
      <main className="flex-1 pt-[82px]">
        {children}
      </main>
      <Footer />
    </div>
  )
}
