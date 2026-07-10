import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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

  return supabaseResponse
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/listings/new',
    '/account/:path*',
    '/auth/:path*',
    '/rigburrito/:path*',
  ],
}
