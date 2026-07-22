import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { isSafeRedirectPath, resolveAuthRedirect } from '@/lib/authRedirect'

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
