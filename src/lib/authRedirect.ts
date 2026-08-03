/** Safe post-auth redirect — internal paths only. */
export const AUTH_REDIRECT_STORAGE_KEY = 'bd_post_auth_redirect'

export function isSafeRedirectPath(path: string | null | undefined): path is string {
  if (!path) return false
  if (!path.startsWith('/') || path.startsWith('//')) return false
  if (path.startsWith('/auth/')) return false
  return true
}

export function resolveAuthRedirect(
  queryRedirect: string | null,
  storedRedirect?: string | null,
): string {
  if (isSafeRedirectPath(queryRedirect)) return queryRedirect
  if (isSafeRedirectPath(storedRedirect)) return storedRedirect
  return '/dashboard'
}

export function storeAuthRedirect(path: string): void {
  if (typeof window === 'undefined') return
  if (!isSafeRedirectPath(path)) return
  window.localStorage.setItem(AUTH_REDIRECT_STORAGE_KEY, path)
  document.cookie = `bd_post_auth_redirect=${encodeURIComponent(path)}; path=/; max-age=604800; SameSite=Lax`
}

export function clearAuthRedirect(): void {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(AUTH_REDIRECT_STORAGE_KEY)
  document.cookie = 'bd_post_auth_redirect=; path=/; max-age=0; SameSite=Lax'
}

export function consumeAuthRedirect(): string | null {
  if (typeof window === 'undefined') return null
  const value = window.localStorage.getItem(AUTH_REDIRECT_STORAGE_KEY)
  clearAuthRedirect()
  return isSafeRedirectPath(value) ? value : null
}

export function authLoginUrl(returnPath: string): string {
  return `/auth/login?redirectTo=${encodeURIComponent(returnPath)}`
}

export function authSignupUrl(returnPath: string): string {
  return `/auth/signup?redirectTo=${encodeURIComponent(returnPath)}`
}
