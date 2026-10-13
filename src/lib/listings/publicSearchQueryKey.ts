/** Normalized query string matching the client /api/listings fetch (limit 48). */
export function buildSearchQueryKey(sp: { get: (name: string) => string | null }): string {
  const params = new URLSearchParams()
  const q = sp.get('q')
  const category = sp.get('category')
  const industry = sp.get('industry')
  const cat = sp.get('cat')
  const country = sp.get('country')
  const sort = sp.get('sort')

  if (q) params.set('q', q)
  if (category) params.set('category', category)
  if (industry) params.set('industry', industry)
  if (cat) params.set('cat', cat)
  if (country) params.set('country', country)
  if (sort) params.set('sort', sort)
  params.set('limit', '48')
  return params.toString()
}
