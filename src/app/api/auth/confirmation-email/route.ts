import { createElement } from 'react'
import { NextRequest, NextResponse } from 'next/server'
import AuthConfirmation from '../../../../../emails/templates/AuthConfirmation'
import { sendTransactionalEmail } from '@/lib/email/sendTransactionalEmail'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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
 * Sends the branded AuthConfirmation email via Resend + email_log.
 */
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: {
    email?: string
    confirmationUrl?: string
    userId?: string | null
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const confirmationUrl =
    typeof body.confirmationUrl === 'string' ? body.confirmationUrl.trim() : ''
  const userId =
    typeof body.userId === 'string' && body.userId.trim() ? body.userId.trim() : null

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
  }

  if (!confirmationUrl || !/^https?:\/\//i.test(confirmationUrl)) {
    return NextResponse.json({ error: 'Valid confirmationUrl is required' }, { status: 400 })
  }

  const result = await sendTransactionalEmail({
    templateType: 'AuthConfirmation',
    recipientEmail: email,
    relatedEntityType: 'user',
    relatedEntityId: userId,
    subject: 'Confirm your email — Black Diamond Marketplace',
    react: createElement(AuthConfirmation, { confirmationUrl }),
  })

  if (!result.sent) {
    return NextResponse.json({ error: 'Failed to send confirmation email' }, { status: 502 })
  }

  return NextResponse.json({ success: true })
}
