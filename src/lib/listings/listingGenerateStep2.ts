import { parsePriceInputValue } from '@/lib/formatPrice'
import { listingLocationMissingLabels } from '@/lib/listings/locationRequirements'

export function listingGenerateStep2Missing(input: {
  title: string
  condition: string
  price: string
  industryId: string
  categoryId: string
  countryId: string
  stateId: string
  countrySlug: string | null
  countryHasSubdivisions: boolean
}): string[] {
  const missing: string[] = []
  const title = input.title.trim()
  if (!title || title === 'Untitled Draft') missing.push('Title')
  if (!input.condition) missing.push('Condition')
  if (!input.industryId) missing.push('Industry')
  if (!input.categoryId) missing.push('Category')
  missing.push(
    ...listingLocationMissingLabels({
      countryId: input.countryId,
      stateId: input.stateId,
      countrySlug: input.countrySlug,
      countryHasSubdivisions: input.countryHasSubdivisions,
    }),
  )
  if (!input.price || parsePriceInputValue(input.price) <= 0) missing.push('Price')
  return missing
}
