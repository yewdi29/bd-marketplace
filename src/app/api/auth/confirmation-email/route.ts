import { createElement } from 'react'
import { NextRequest, NextResponse } from 'next/server'
import AuthConfirmation from '../../../../../emails/templates/AuthConfirmation'
import { sendTransactionalEmail } from '@/lib/email/sendTransactionalEmail'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const OTP_RE = /^\d{6}$/

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.AUTH_EMAIL_RELAY_SECRET
  if (!secret) return false

  const header =
    req.headers.get('x-auth-email-relay-secret') ??
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')

  return Boolean(header && header === secret)
}

/**
 * Internal relay target for the Supabase send-email-hook Edge Function.
 * Sends AuthConfirmation with the raw 6-digit OTP (email_data.token) for on-site entry.
 */
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: {
    email?: string
    /** 6-digit OTP from email_data.token */
    otpCode?: string
    /** @deprecated Link-based flow — ignored for signup OTP emails */
    tokenHash?: string
    type?: string
    userId?: string | null
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const otpCode = typeof body.otpCode === 'string' ? body.otpCode.trim() : ''
  const type = typeof body.type === 'string' ? body.type.trim() : 'signup'
  const userId =
    typeof body.userId === 'string' && body.userId.trim() ? body.userId.trim() : null

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
  }

  if (!OTP_RE.test(otpCode)) {
    return NextResponse.json({ error: 'otpCode must be a 6-digit code' }, { status: 400 })
  }

  if (type !== 'signup') {
    return NextResponse.json({ error: 'type must be signup' }, { status: 400 })
  }

  const result = await sendTransactionalEmail({
    templateType: 'AuthConfirmation',
    recipientEmail: email,
    relatedEntityType: 'user',
    relatedEntityId: userId,
    subject: 'Confirm your email — Black Diamond Marketplace',
    react: createElement(AuthConfirmation, { otpCode }),
  })

  if (!result.sent) {
    return NextResponse.json({ error: 'Failed to send confirmation email' }, { status: 502 })
  }

  return NextResponse.json({ success: true })
}
