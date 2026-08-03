import { createElement } from 'react'
import { NextRequest, NextResponse } from 'next/server'
import AuthPasswordReset from '../../../../../emails/templates/AuthPasswordReset'
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
 * Internal relay target for the Supabase send-email-hook Edge Function (recovery).
 * Sends the branded AuthPasswordReset email via Resend + email_log.
 */
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: {
    email?: string
    resetUrl?: string
    userId?: string | null
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const resetUrl = typeof body.resetUrl === 'string' ? body.resetUrl.trim() : ''
  const userId =
    typeof body.userId === 'string' && body.userId.trim() ? body.userId.trim() : null

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
  }

  if (!resetUrl || !/^https?:\/\//i.test(resetUrl)) {
    return NextResponse.json({ error: 'Valid resetUrl is required' }, { status: 400 })
  }

  const result = await sendTransactionalEmail({
    templateType: 'AuthPasswordReset',
    recipientEmail: email,
    relatedEntityType: 'user',
    relatedEntityId: userId,
    subject: 'Reset your password — Black Diamond Marketplace',
    react: createElement(AuthPasswordReset, { resetUrl }),
  })

  if (!result.sent) {
    return NextResponse.json({ error: 'Failed to send password reset email' }, { status: 502 })
  }

  return NextResponse.json({ success: true })
}
