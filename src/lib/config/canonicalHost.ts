import { NextResponse, type NextRequest } from 'next/server'

/** Production canonical host (non-www). Must match Vercel primary domain and Stripe webhook URL. */
export const CANONICAL_HOST = 'blackdiamondmkt.com'

/**
 * Redirect www → apex for user-facing routes only.
 * API routes (especially /api/stripe/webhook) must never redirect — Stripe does not follow 3xx.
 *
 * Note: Vercel domain-level redirects run at the edge before middleware. Set
 * blackdiamondmkt.com as the primary production domain in Vercel so apex requests
 * are not 308'd to www before they reach this app.
 */
export function getCanonicalHostRedirect(request: NextRequest): NextResponse | null {
  const pathname = request.nextUrl.pathname

  if (pathname.startsWith('/api/')) {
    return null
  }

  const host = request.headers.get('host')?.split(':')[0]?.toLowerCase()
  if (!host || host === CANONICAL_HOST) {
    return null
  }

  if (host === `www.${CANONICAL_HOST}`) {
    const url = request.nextUrl.clone()
    url.protocol = 'https:'
    url.host = CANONICAL_HOST
    return NextResponse.redirect(url, 308)
  }

  return null
}
