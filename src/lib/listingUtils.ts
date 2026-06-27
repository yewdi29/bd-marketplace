export function isNewListing(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() < 7 * 24 * 60 * 60 * 1000
}

export function countryFlagClass(isoCode: string | null | undefined): string | null {
  if (!isoCode) return null
  const code = isoCode.trim().toLowerCase()
  if (!/^[a-z]{2}$/.test(code)) return null
  return `fi fis fi-${code}`
}
