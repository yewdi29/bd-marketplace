function firstRel<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

/** City name from city_id when set, otherwise the free-text location_city. */
export function listingDisplayCity(input: {
  location_city?: string | null
  cities?: { name: string } | { name: string }[] | null
}): string | null {
  const city = firstRel(input.cities)
  const named = city?.name?.trim()
  if (named) return named
  const text = input.location_city?.trim()
  return text || null
}
