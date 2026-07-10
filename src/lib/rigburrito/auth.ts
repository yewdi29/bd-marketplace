import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export interface AdminAuthResult {
  userId: string
  email: string
}

async function getAuthenticatedAdminUserId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') return null
  return user.id
}

/** Redirect non-admin and unauthenticated visitors to homepage silently. */
export async function requireRigburritoAccess(): Promise<void> {
  const adminId = await getAuthenticatedAdminUserId()
  if (!adminId) redirect('/')
}

/** Server guard for MFA auth pages — admin role required before render. */
export async function requireAdminAuthPage(): Promise<AdminAuthResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/')

  return { userId: user.id, email: user.email ?? '' }
}

export async function getAdminSession(): Promise<AdminAuthResult | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') return null

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (aal?.currentLevel !== 'aal2') return null

  return { userId: user.id, email: user.email ?? '' }
}

export async function requireAdminLayout(): Promise<AdminAuthResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/')

  const { data: factors } = await supabase.auth.mfa.listFactors()
  const hasVerifiedTotp = factors?.totp?.some(f => f.status === 'verified') ?? false

  if (!hasVerifiedTotp) redirect('/rigburrito/setup-mfa')

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (aal?.currentLevel !== 'aal2' && aal?.nextLevel === 'aal2') {
    redirect('/rigburrito/verify')
  }

  return { userId: user.id, email: user.email ?? '' }
}

export async function requireAdminApi(): Promise<
  | { ok: true; userId: string }
  | { ok: false; error: string; status: number }
> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { ok: false, error: 'Unauthorized', status: 401 }

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (aal?.currentLevel !== 'aal2') {
    return { ok: false, error: 'MFA verification required', status: 403 }
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { ok: false, error: 'Forbidden', status: 403 }
  }

  return { ok: true, userId: user.id }
}
