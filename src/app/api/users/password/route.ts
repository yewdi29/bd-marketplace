import { createElement } from 'react'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import PasswordChanged from '../../../../../emails/templates/PasswordChanged'
import { passwordMeetsRequirements } from '@/lib/auth/passwordRequirements'
import { getEmailAppUrl } from '@/lib/email/resendClient'
import { sendTransactionalEmail } from '@/lib/email/sendTransactionalEmail'

/**
 * Change password for the signed-in user.
 * Uses the service-role admin API so MFA (AAL2) is not required on the client session.
 * Verifies the current password first, then sends a confirmation email.
 */
export async function POST(request: NextRequest) {
  const cookieStore = await cookies()

  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )

  const { data: { user } } = await authClient.auth.getUser()
  if (!user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { currentPassword?: unknown; newPassword?: unknown }
  try {
    body = await request.json() as { currentPassword?: unknown; newPassword?: unknown }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : ''
  const newPassword = typeof body.newPassword === 'string' ? body.newPassword : ''

  if (!currentPassword) {
    return NextResponse.json({ error: 'Current password is required' }, { status: 400 })
  }
  if (!passwordMeetsRequirements(newPassword)) {
    return NextResponse.json(
      {
        error:
          'Password must be at least 8 characters and include uppercase, lowercase, a number, and a symbol.',
      },
      { status: 400 },
    )
  }
  if (currentPassword === newPassword) {
    return NextResponse.json(
      { error: 'New password must be different from your current password' },
      { status: 400 },
    )
  }

  // Verify current password without depending on MFA elevation.
  const verifier = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
  const { error: verifyError } = await verifier.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  })
  if (verifyError) {
    return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
    password: newPassword,
  })
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Confirmation email — non-blocking for the password change success path
  void sendTransactionalEmail({
    templateType: 'PasswordChanged',
    recipientEmail: user.email,
    relatedEntityType: 'user',
    relatedEntityId: user.id,
    subject: 'Your password was updated — Black Diamond Marketplace',
    react: createElement(PasswordChanged, {
      settingsUrl: `${getEmailAppUrl()}/dashboard/settings`,
    }),
  }).catch(err => {
    console.error('[password] confirmation email failed:', err)
  })

  return NextResponse.json({ success: true })
}
