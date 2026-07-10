export interface ListingChangeSnapshot {
  title?: string | null
  description?: string | null
  price?: number | null
  location_city?: string | null
  location_state?: string | null
  country_id?: string | null
  category_id?: string | null
  industry_id?: string | null
  condition?: string | null
  listing_images?: { id: string }[] | null
}

function levenshtein(a: string, b: string): number {
  const rows = a.length + 1
  const cols = b.length + 1
  const matrix: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0))

  for (let i = 0; i < rows; i++) matrix[i][0] = i
  for (let j = 0; j < cols; j++) matrix[0][j] = j

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      )
    }
  }

  return matrix[rows - 1][cols - 1]
}

function str(value: string | null | undefined): string {
  return (value ?? '').trim()
}

function imageIds(listing: ListingChangeSnapshot): Set<string> {
  return new Set((listing.listing_images ?? []).map(img => img.id))
}

function imagesChanged(oldListing: ListingChangeSnapshot, newListing: ListingChangeSnapshot): boolean {
  const oldIds = imageIds(oldListing)
  const newIds = imageIds(newListing)

  if (oldIds.size !== newIds.size) return true
  return Array.from(oldIds).some(id => !newIds.has(id))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function detectMajorChange(oldListing: any, newListing: any): boolean {
  const oldSnap = oldListing as ListingChangeSnapshot
  const newSnap = newListing as ListingChangeSnapshot

  const oldTitle = str(oldSnap.title)
  const newTitle = str(newSnap.title)
  if (oldTitle !== newTitle) {
    const lengthDiff = Math.abs(newTitle.length - oldTitle.length)
    if (lengthDiff > 10 || levenshtein(oldTitle, newTitle) > 10) {
      return true
    }
  }

  const oldDescription = str(oldSnap.description)
  const newDescription = str(newSnap.description)
  if (oldDescription !== newDescription) {
    if (Math.abs(newDescription.length - oldDescription.length) > 75) {
      return true
    }
  }

  const oldPrice = Number(oldSnap.price ?? 0)
  const newPrice = Number(newSnap.price ?? 0)
  if (oldPrice !== newPrice) {
    if (oldPrice === 0) {
      return true
    }
    if (Math.abs(newPrice - oldPrice) / oldPrice > 0.10) {
      return true
    }
  }

  if (str(oldSnap.location_city) !== str(newSnap.location_city)) return true
  if (str(oldSnap.location_state) !== str(newSnap.location_state)) return true
  if (str(oldSnap.country_id) !== str(newSnap.country_id)) return true
  if (str(oldSnap.category_id) !== str(newSnap.category_id)) return true
  if (str(oldSnap.industry_id) !== str(newSnap.industry_id)) return true
  if (str(oldSnap.condition) !== str(newSnap.condition)) return true

  if (imagesChanged(oldSnap, newSnap)) return true

  return false
}
