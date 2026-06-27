/** Disable Next.js prefetch for auth-protected nav targets (heavy RSC payloads). */
export function isAuthenticatedNavHref(href: string): boolean {
  return (
    href.startsWith('/dashboard') ||
    href.startsWith('/account') ||
    href.startsWith('/listings/new') ||
    href.startsWith('/auth/')
  )
}

export function navLinkPrefetch(href: string): boolean | undefined {
  return isAuthenticatedNavHref(href) ? false : undefined
}
