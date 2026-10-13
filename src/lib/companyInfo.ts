function env(name: string): string | null {
  const value = process.env[name]?.trim()
  return value ? value : null
}

export const COMPANY = {
  legalName: env('NEXT_PUBLIC_BD_LEGAL_NAME'),
  streetAddress: env('NEXT_PUBLIC_BD_ADDRESS_STREET'),
  city: env('NEXT_PUBLIC_BD_ADDRESS_CITY'),
  region: env('NEXT_PUBLIC_BD_ADDRESS_REGION'),
  postalCode: env('NEXT_PUBLIC_BD_ADDRESS_POSTAL'),
  country: env('NEXT_PUBLIC_BD_ADDRESS_COUNTRY'),
  phone: env('NEXT_PUBLIC_BD_PHONE'),
  phoneE164: env('NEXT_PUBLIC_BD_PHONE_E164'),
}

export const SOCIAL_LINKS = {
  instagram: env('NEXT_PUBLIC_BD_SOCIAL_INSTAGRAM'),
  linkedin: env('NEXT_PUBLIC_BD_SOCIAL_LINKEDIN'),
  facebook: env('NEXT_PUBLIC_BD_SOCIAL_FACEBOOK'),
  x: env('NEXT_PUBLIC_BD_SOCIAL_X'),
}

export function formatCompanyAddress(): string | null {
  const cityRegion = [COMPANY.city, COMPANY.region].filter(Boolean).join(', ')
  const cityRegionPostal = [cityRegion, COMPANY.postalCode].filter(Boolean).join(' ')
  const parts = [COMPANY.streetAddress, cityRegionPostal, COMPANY.country].filter(Boolean)
  return parts.length > 0 ? parts.join(', ') : null
}

export function companyTelephone(): string | null {
  return COMPANY.phoneE164 ?? COMPANY.phone
}

export function companyTelHref(): string | null {
  const tel = companyTelephone()
  if (!tel) return null
  const digits = tel.replace(/[^\d+]/g, '')
  return digits ? `tel:${digits}` : null
}

/** Privacy/terms identity line — null means keep the existing fallback copy. */
export function companyLegalFooterLine(): string | null {
  const address = formatCompanyAddress()
  if (COMPANY.legalName && address) return `${COMPANY.legalName}, ${address}`
  if (COMPANY.legalName) return COMPANY.legalName
  if (address) return address
  return null
}

export function socialUrls(): string[] {
  return Object.values(SOCIAL_LINKS).filter((url): url is string => Boolean(url))
}
