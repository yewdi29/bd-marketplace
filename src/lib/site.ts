/** Canonical public site URL for SEO, Open Graph, and share links.
 *  Must match the live host (Vercel serves www; apex 301s here). */
export const PUBLIC_SITE_URL = 'https://www.blackdiamondmkt.com'

/** Absolute canonical URL. `path` should start with `/` or be empty for the homepage. */
export function canonicalUrl(path = ''): string {
  if (!path || path === '/') return PUBLIC_SITE_URL
  return `${PUBLIC_SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}
