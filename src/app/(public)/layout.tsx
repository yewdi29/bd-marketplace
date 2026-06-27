import PublicShell from '@/components/layout/PublicShell'
import { getAuthUser } from '@/lib/supabase/auth-server'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser()

  const initialAuth = user
    ? { id: user.id, email: user.email ?? '' }
    : null

  return (
    <PublicShell initialAuth={initialAuth}>
      {children}
    </PublicShell>
  )
}
