function supabaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  if (!raw) return null
  try {
    return new URL(raw)
  } catch {
    return null
  }
}

const supabase = supabaseUrl()
const supabaseHttps = supabase?.origin ?? ''
const supabaseWss = supabase ? `wss://${supabase.host}` : ''

const cspReportOnly = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://js.stripe.com https://vercel.live",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob:${supabaseHttps ? ` ${supabaseHttps}` : ''} https://image.mux.com https://*.google-analytics.com https://www.googletagmanager.com`,
  "font-src 'self' data:",
  `connect-src 'self'${supabaseHttps ? ` ${supabaseHttps}` : ''}${supabaseWss ? ` ${supabaseWss}` : ''} https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://*.mux.com https://*.litix.io https://storage.googleapis.com https://api.stripe.com https://vercel.live`,
  "media-src 'self' blob: https://*.mux.com",
  "worker-src 'self' blob:",
  "frame-src https://js.stripe.com https://hooks.stripe.com https://vercel.live",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(self), geolocation=(self), payment=()',
  },
  { key: 'Content-Security-Policy-Report-Only', value: cspReportOnly },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  images: {
    deviceSizes: [384, 414, 448, 640, 750, 828, 1080, 1200, 1920, 2048],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: supabase?.hostname ?? 'wjnerswualzlurhdiizn.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        source: '/rigburrito',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      {
        source: '/rigburrito/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ]
  },
  async redirects() {
    return [
      {
        source: '/listings',
        destination: '/search',
        permanent: true,
      },
      {
        source: '/knowledge-base',
        destination: '/journal',
        permanent: true,
      },
      // Legacy knowledge-base slugs that were renamed after the /journal move
      {
        source: '/knowledge-base/blowout-preventer-maintenance-checklist',
        destination: '/journal/bop-maintenance-checklist',
        permanent: true,
      },
      {
        source: '/knowledge-base/valuing-used-drilling-rig-2025',
        destination: '/journal/how-to-value-a-used-drill-rig-in-2026',
        permanent: true,
      },
      {
        source: '/knowledge-base/:slug',
        destination: '/journal/:slug',
        permanent: true,
      },
    ]
  },
}
export default nextConfig
