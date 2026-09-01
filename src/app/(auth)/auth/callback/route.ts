import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { isSafeRedirectPath, resolveAuthRedirect } from '@/lib/authRedirect'
import { markUserEmailVerified } from '@/lib/auth/markUserEmailVerified'
import { dispatchWelcomeEmailOnceSafe } from '@/lib/email/welcomeEmail'
import { createServiceClient } from '@/lib/rigburrito/service'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const cookieStore = cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()

      // Branded welcome — once, after signup confirmation succeeds (supplements Supabase Auth mail).
      if (user?.id && user.email) {
        try {
          await markUserEmailVerified(user.id, user.email_confirmed_at ?? null)
        } catch {
          // Non-fatal
        }

        let firstName: string | null = null
        try {
          const service = createServiceClient()
          const { data: profile } = await service
            .from('users')
            .select('full_name')
            .eq('id', user.id)
            .maybeSingle()

          const fullName = profile?.full_name?.trim()
          firstName = fullName ? fullName.split(/\s+/)[0] ?? null : null
        } catch {
          // Non-fatal — welcome still sends without first name
        }

        dispatchWelcomeEmailOnceSafe({
          userId: user.id,
          recipientEmail: user.email,
          firstName,
        })
      }

      const redirectParam = searchParams.get('redirectTo')
      const cookieRaw = request.cookies.get('bd_post_auth_redirect')?.value
      const cookieRedirect = cookieRaw ? decodeURIComponent(cookieRaw) : null
      const destination = resolveAuthRedirect(
        redirectParam,
        isSafeRedirectPath(cookieRedirect) ? cookieRedirect : null,
      )
      const response = NextResponse.redirect(`${origin}${destination}`)
      response.cookies.delete('bd_post_auth_redirect')
      return response
    }
  }

  // Code missing or exchange failed — send to login with an error flag
  return NextResponse.redirect(`${origin}/auth/login?error=confirmation_failed`)
}
