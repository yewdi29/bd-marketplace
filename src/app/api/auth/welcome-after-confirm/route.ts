import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/rigburrito/service'
import { dispatchWelcomeEmailOnce } from '@/lib/email/welcomeEmail'

/**
 * Called after client-side signup verifyOtp succeeds on /auth/confirm-email.
 * Reuses the same once-only welcome dispatch as /auth/callback.
 */
export async function POST() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user?.id || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let firstName: string | null = null
    try {
      const service = createServiceClient()
      const { data: profile } = await service
        .from('users')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle()

      const fullName = profile?.full_name?.trim()
      firstName = fullName ? fullName.split(/\s+/)[0] ?? null : null
    } catch {
      // Non-fatal
    }

    await dispatchWelcomeEmailOnce({
      userId: user.id,
      recipientEmail: user.email,
      firstName,
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to send welcome email' }, { status: 500 })
  }
}
