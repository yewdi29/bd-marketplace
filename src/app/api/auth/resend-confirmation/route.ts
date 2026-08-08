import { NextRequest, NextResponse } from 'next/server'
import { sendSignupOtpEmail } from '@/lib/auth/sendSignupOtpEmail'

export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
  }
  if (!password) {
    return NextResponse.json({ error: 'Password is required to resend the code.' }, { status: 400 })
  }

  const result = await sendSignupOtpEmail({ email, password })

  if (result.alreadyConfirmed) {
    return NextResponse.json(
      { error: result.error, code: 'already_registered' },
      { status: 400 },
    )
  }

  if (!result.sent) {
    return NextResponse.json(
      { error: result.error ?? 'Could not resend confirmation code.' },
      { status: 400 },
    )
  }

  return NextResponse.json({ success: true })
}
