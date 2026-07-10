export function sellerPortalHref(
  signedIn: boolean,
  options?: { newListing?: boolean },
): string {
  if (signedIn) return options?.newListing ? '/dashboard?new=true' : '/dashboard'
  return '/auth/signup'
}
