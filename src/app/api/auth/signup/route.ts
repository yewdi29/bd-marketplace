import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { email, password, fullName, companyName, city, state, country } = body

  if (!email || !password || !fullName || !city || !state || !country) {
    return NextResponse.json({ error: 'All required fields must be filled in.' }, { status: 400 })
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

  const { data: signUpData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      data: {
        full_name: fullName,
        company_name: companyName ?? null,
        city,
        state,
        country,
        signup_ip_location: ip,
      },
    },
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // ── Post-signup enrichment via service role ───────────────────────────────
  // Runs async enrichment (duplicate detection, email domain) without blocking
  // the signup response. Uses admin client so we can write to the users table
  // that was just populated by the on_auth_user_created trigger.

  const newUserId = signUpData.user?.id
  if (newUserId) {
    try {
      const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      const emailDomain = email.split('@')[1]?.toLowerCase() ?? null
      const enrichment: Record<string, unknown> = {
        email_domain: emailDomain,
        updated_at: new Date().toISOString(),
      }

      // Soft-check for duplicate company name (case-insensitive)
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
