import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { passwordMeetsRequirements } from '@/lib/auth/passwordRequirements'
import { sendSignupOtpEmail } from '@/lib/auth/sendSignupOtpEmail'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { email, password, fullName, companyName, city, state, country, phone } = body

  if (!email || !password || !fullName || !city || !state || !country || !phone) {
    return NextResponse.json({ error: 'All required fields must be filled in.' }, { status: 400 })
  }

  const phoneTrimmed = typeof phone === 'string' ? phone.trim() : ''
  if (!phoneTrimmed) {
    return NextResponse.json({ error: 'Phone number is required.' }, { status: 400 })
  }

  if (!passwordMeetsRequirements(password)) {
    return NextResponse.json(
      {
        error:
          'Password must be at least 8 characters and include uppercase, lowercase, a number, and a symbol.',
      },
      { status: 400 },
    )
  }

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    null

  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''
  const admin = getAdminClient()

  /**
   * Create the auth user with the service role (does not rely on Send Email Hook).
   * Confirmation OTP is generated + emailed explicitly below via Resend.
   */
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: normalizedEmail,
    password,
    email_confirm: false,
    user_metadata: {
      full_name: fullName,
      company_name: companyName ?? null,
      city,
      state,
      country,
      phone: phoneTrimmed,
      signup_ip_location: ip,
    },
  })

  let userId = created.user?.id ?? null

  if (createError) {
    const msg = createError.message.toLowerCase()
    const alreadyExists =
      msg.includes('already') || msg.includes('registered') || msg.includes('exists')

    if (!alreadyExists) {
      return NextResponse.json({ error: createError.message }, { status: 400 })
    }

    // Pending unconfirmed account from a prior attempt — resend OTP.
    // Confirmed accounts get already_registered from sendSignupOtpEmail.
    const otp = await sendSignupOtpEmail({
      email: normalizedEmail,
      password,
    })

    if (otp.alreadyConfirmed) {
      return NextResponse.json(
        {
          error: otp.error ?? 'An account with this email already exists. Please sign in instead.',
          code: 'already_registered',
        },
        { status: 400 },
      )
    }

    if (!otp.sent) {
      return NextResponse.json(
        {
          error:
            otp.error ??
            'An account with this email already exists. Please sign in instead.',
          code: 'already_registered',
        },
        { status: 400 },
      )
    }

    return NextResponse.json({ success: true, confirmationSent: true })
  }

  // ── Post-signup enrichment via service role ───────────────────────────────
  if (userId) {
    try {
      const emailDomain = normalizedEmail.split('@')[1]?.toLowerCase() ?? null
      const enrichment: Record<string, unknown> = {
        full_name: typeof fullName === 'string' ? fullName.trim() || null : null,
        company_name: typeof companyName === 'string' ? companyName.trim() || null : null,
        phone: phoneTrimmed,
        city: typeof city === 'string' ? city.trim() || null : null,
        state: typeof state === 'string' ? state.trim() || null : null,
        country: typeof country === 'string' ? country.trim() || null : null,
        email_domain: emailDomain,
        updated_at: new Date().toISOString(),
      }

      if (companyName) {
        const { data: duplicate } = await admin
          .from('users')
          .select('id')
          .ilike('company_name', companyName.trim())
          .neq('id', userId)
          .maybeSingle()

        if (duplicate) {
          enrichment.company_name_duplicate = true
        }
      }

      await admin.from('users').update(enrichment).eq('id', userId)
    } catch {
      // Non-fatal — signup succeeded, enrichment failed silently
    }
  }

  const otp = await sendSignupOtpEmail({
    email: normalizedEmail,
    password,
    userId,
  })

  if (!otp.sent) {
    return NextResponse.json(
      {
        error:
          otp.error ??
          'Account created, but the confirmation email failed to send. Use Resend code on the next screen.',
        code: 'confirmation_send_failed',
        userCreated: true,
      },
      { status: 502 },
    )
  }

  return NextResponse.json({ success: true, confirmationSent: true })
}
