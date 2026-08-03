import { createElement } from 'react'
import { NextRequest, NextResponse } from 'next/server'
import AuthConfirmation from '../../../../../emails/templates/AuthConfirmation'
import { getEmailAppUrl } from '@/lib/email/resendClient'
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
 * Sends AuthConfirmation linking to our intermediate /auth/confirm-email page
 * (never the raw Supabase /auth/v1/verify URL — avoids scanner token burn).
 */
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: {
    email?: string
    tokenHash?: string
    type?: string
    userId?: string | null
    /** @deprecated Prefer tokenHash — still accepted for backwards compatibility */
    confirmationUrl?: string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const tokenHash = typeof body.tokenHash === 'string' ? body.tokenHash.trim() : ''
  const type = typeof body.type === 'string' ? body.type.trim() : 'signup'
  const userId =
    typeof body.userId === 'string' && body.userId.trim() ? body.userId.trim() : null

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
  }

  if (!tokenHash) {
    return NextResponse.json({ error: 'tokenHash is required' }, { status: 400 })
  }

  if (type !== 'signup') {
    return NextResponse.json({ error: 'type must be signup' }, { status: 400 })
  }

  const params = new URLSearchParams({
    token_hash: tokenHash,
    type,
    email,
  })
  const confirmationUrl = `${getEmailAppUrl()}/auth/confirm-email?${params.toString()}`

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
