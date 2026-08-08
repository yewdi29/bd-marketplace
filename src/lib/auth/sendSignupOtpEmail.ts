import { createElement } from 'react'
import { createClient } from '@supabase/supabase-js'
import AuthConfirmation from '../../../emails/templates/AuthConfirmation'
import { sendTransactionalEmail } from '@/lib/email/sendTransactionalEmail'

/**
 * Generate a signup OTP via Admin API and send AuthConfirmation through Resend.
 * Bypasses the Supabase Send Email Hook so invite/onboarding is not blocked when
 * the Edge relay is misconfigured or failing silently.
 */
export async function sendSignupOtpEmail(opts: {
  email: string
  /** Required for admin.generateLink type=signup */
  password: string
  /** Optional — used for email_log related_entity_id */
  userId?: string | null
}): Promise<{ sent: boolean; error?: string; alreadyConfirmed?: boolean }> {
  const email = opts.email.trim().toLowerCase()
  const password = opts.password
  if (!password) {
    return { sent: false, error: 'Password is required to send a confirmation code.' }
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'signup',
    email,
    password,
  })

  if (linkError) {
    const msg = linkError.message.toLowerCase()
    if (
      msg.includes('already') ||
      msg.includes('confirmed') ||
      msg.includes('registered') ||
      msg.includes('exists')
    ) {
      return {
        sent: false,
        alreadyConfirmed: true,
        error: 'An account with this email already exists. Please sign in instead.',
      }
    }
    return { sent: false, error: linkError.message }
  }

  const otpCode = linkData.properties?.email_otp?.trim()
  if (!otpCode || !/^\d{6}$/.test(otpCode)) {
    return { sent: false, error: 'Could not generate a confirmation code. Please try again.' }
  }

  const userId = opts.userId ?? linkData.user?.id ?? null

  const result = await sendTransactionalEmail({
    templateType: 'AuthConfirmation',
    recipientEmail: email,
    relatedEntityType: 'user',
    relatedEntityId: userId,
    subject: 'Confirm your email — Black Diamond Marketplace',
    react: createElement(AuthConfirmation, { otpCode }),
  })

  if (!result.sent) {
    return { sent: false, error: 'Failed to send confirmation email. Please try again.' }
  }

  return { sent: true }
}
