import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { passwordMeetsRequirements } from '@/lib/auth/passwordRequirements'

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

  // Use anon key so Supabase sends the confirmation email via signUp().
  // admin.createUser() does not fire the confirmation email reliably.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''

  const { data: signUpData, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      data: {
        full_name: fullName,
        company_name: companyName ?? null,
        city,
        state,
        country,
        phone: phoneTrimmed,
        signup_ip_location: ip,
      },
    },
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  /**
   * Supabase anti-enumeration: if the email already has an account, signUp
   * returns 200 with an empty identities array and does NOT send confirmation.
   * Resend the signup OTP so invite/onboarding (and retries) still get a code.
   */
  const identities = signUpData.user?.identities
  if (signUpData.user && (!identities || identities.length === 0)) {
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: normalizedEmail,
    })

    if (resendError) {
      const msg = resendError.message.toLowerCase()
      if (msg.includes('already') || msg.includes('confirmed') || msg.includes('registered')) {
        return NextResponse.json(
          {
            error: 'An account with this email already exists. Please sign in instead.',
            code: 'already_registered',
          },
          { status: 400 },
        )
      }
      return NextResponse.json(
        { error: resendError.message || 'Could not send confirmation code. Please try again.' },
        { status: 400 },
      )
    }

    return NextResponse.json({ success: true, confirmationResent: true })
  }

  // ── Post-signup enrichment via service role ───────────────────────────────
  const newUserId = signUpData.user?.id
  if (newUserId) {
    try {
      const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      const emailDomain = normalizedEmail.split('@')[1]?.toLowerCase() ?? null
      // Mirror signup form fields onto public.users (same columns settings reads/writes).
      // handle_new_user() inserts these from metadata; this update is defense-in-depth.
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
        const { data: duplicate } = await adminClient
          .from('users')
          .select('id')
          .ilike('company_name', companyName.trim())
          .neq('id', newUserId)
          .maybeSingle()

        if (duplicate) {
          enrichment.company_name_duplicate = true
        }
      }

      await adminClient
        .from('users')
        .update(enrichment)
        .eq('id', newUserId)
    } catch {
      // Non-fatal — signup succeeded, enrichment failed silently
    }
  }

  return NextResponse.json({ success: true })
}
