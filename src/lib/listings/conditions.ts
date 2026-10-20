export const LISTING_CONDITION_VALUES = [
  'new',
  'like_new',
  'great',
  'good',
  'fair',
  'poor',
  'rebuilt',
] as const

export type ListingConditionValue = (typeof LISTING_CONDITION_VALUES)[number]

export const LISTING_CONDITION_OPTIONS: { value: ListingConditionValue; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'rebuilt', label: 'Rebuilt' },
  { value: 'great', label: 'Great' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
]

export function listingConditionLabel(value: string): string {
  const match = LISTING_CONDITION_OPTIONS.find(c => c.value === value)
  return match?.label ?? value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}
