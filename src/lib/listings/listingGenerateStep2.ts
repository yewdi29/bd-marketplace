import { parsePriceInputValue } from '@/lib/formatPrice'

export function listingGenerateStep2Missing(input: {
  title: string
  condition: string
  price: string
  industryId: string
  categoryId: string
  countryId: string
  locationCity: string
  stateId: string
  countrySlug: string | null
  needsSubdivision: boolean
}): string[] {
  const missing: string[] = []
  const title = input.title.trim()
  if (!title || title === 'Untitled Draft') missing.push('Title')
  if (!input.condition) missing.push('Condition')
  if (!input.industryId) missing.push('Industry')
  if (!input.categoryId) missing.push('Category')
  if (!input.countryId) missing.push('Country')
  if (input.countrySlug !== 'mexico' && !input.locationCity.trim()) missing.push('City')
  if (input.needsSubdivision && !input.stateId) {
    missing.push(input.countrySlug === 'canada' ? 'Province' : 'State')
  }
  if (!input.price || parsePriceInputValue(input.price) <= 0) missing.push('Price')
  return missing
}
