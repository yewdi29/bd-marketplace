import { createElement } from 'react'
import { NextRequest, NextResponse } from 'next/server'
import AuthPasswordReset from '../../../../../emails/templates/AuthPasswordReset'
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
 * Internal relay target for the Supabase send-email-hook Edge Function (recovery).
 * Links directly to /auth/reset-password with token_hash held inert until form submit
 * (avoids scanner prefetch burning the one-time token).
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
    resetUrl?: string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const tokenHash = typeof body.tokenHash === 'string' ? body.tokenHash.trim() : ''
  const type = typeof body.type === 'string' ? body.type.trim() : 'recovery'
  const userId =
    typeof body.userId === 'string' && body.userId.trim() ? body.userId.trim() : null

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
  }

  if (!tokenHash) {
    return NextResponse.json({ error: 'tokenHash is required' }, { status: 400 })
  }

  if (type !== 'recovery') {
    return NextResponse.json({ error: 'type must be recovery' }, { status: 400 })
  }

  const params = new URLSearchParams({
    token_hash: tokenHash,
    type,
  })
  const resetUrl = `${getEmailAppUrl()}/auth/reset-password?${params.toString()}`

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
