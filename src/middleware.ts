import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import {
  ORG_BILLING_SETUP_ALLOWED_PATH,
} from '@/lib/organizations/billingGate'

const PROTECTED_ROUTES = ['/dashboard', '/listings/new', '/account']
const RIGBURRITO_LOGIN = '/rigburrito/login'

function redirectHome(request: NextRequest): NextResponse {
  const homeUrl = request.nextUrl.clone()
  homeUrl.pathname = '/'
  homeUrl.search = ''
  return NextResponse.redirect(homeUrl, 307)
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // API routes must never redirect — Stripe webhooks and other integrations
  // require a direct 200/4xx response (Vercel edge handles www canonicalization).
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  const isRigburrito = pathname.startsWith('/rigburrito')
  const isRigburritoLogin = pathname === RIGBURRITO_LOGIN
  const isProtected = PROTECTED_ROUTES.some(route => pathname.startsWith(route))
  const isAuthRoute = pathname.startsWith('/auth/')

  if (!isProtected && !isAuthRoute && !isRigburrito) {
    return NextResponse.next()
  }

  const requestHeaders = new Headers(request.headers)
  if (isRigburrito) {
    requestHeaders.set('x-rigburrito-pathname', pathname)
  }

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request: { headers: requestHeaders },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (isRigburrito && !isRigburritoLogin) {
    if (!user) return redirectHome(request)

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') return redirectHome(request)
  }

  if (isProtected && !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/auth/login'
    loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (
    user &&
    (pathname === '/auth/login' || pathname === '/auth/signup')
  ) {
    const homeUrl = request.nextUrl.clone()
    homeUrl.pathname = '/'
    return NextResponse.redirect(homeUrl)
  }

  // Org members without a payment method may only reach Company Settings → Billing.
  if (user && pathname.startsWith('/dashboard')) {
    const { data: orgMember } = await supabase
      .from('org_members')
      .select(`
        is_primary_owner,
        organizations!inner(preferred_payment_method)
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()

    if (orgMember) {
      const org = orgMember.organizations as unknown as { preferred_payment_method: string | null } | null
      const billingComplete = Boolean(org?.preferred_payment_method)

      if (!billingComplete) {
        const onBillingSetupPage =
          pathname === ORG_BILLING_SETUP_ALLOWED_PATH
          || pathname.startsWith(`${ORG_BILLING_SETUP_ALLOWED_PATH}/`)

        if (!onBillingSetupPage) {
          const redirectUrl = request.nextUrl.clone()
          redirectUrl.pathname = ORG_BILLING_SETUP_ALLOWED_PATH
          redirectUrl.searchParams.set('tab', 'billing')
          redirectUrl.searchParams.delete('setup')
          return NextResponse.redirect(redirectUrl)
        }
      }
    }
  }

  if (user && pathname.startsWith('/listings/new')) {
    const { data: orgMember } = await supabase
      .from('org_members')
      .select('is_primary_owner, organizations!inner(preferred_payment_method)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()

    if (orgMember) {
      const org = orgMember.organizations as unknown as { preferred_payment_method: string | null } | null
      if (!org?.preferred_payment_method) {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = ORG_BILLING_SETUP_ALLOWED_PATH
        redirectUrl.searchParams.set('tab', 'billing')
        redirectUrl.searchParams.delete('setup')
        return NextResponse.redirect(redirectUrl)
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/api/:path*',
    '/dashboard/:path*',
    '/listings/new',
    '/account/:path*',
    '/auth/:path*',
    '/rigburrito/:path*',
  ],
}
