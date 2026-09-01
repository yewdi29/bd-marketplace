/**
 * Listing specs helpers — keep dedicated columns (year, model, manufacturer)
 * separate from the freeform specs JSON blob shown in the public specs grid.
 */

/** Keys stored in specs JSON but never shown in the public specifications grid. */
export const SPECS_INTERNAL_KEYS = new Set(['seller_prompt'])

/**
 * Keys the AI must not write into specs — they have dedicated listing columns
 * and are rendered separately on the listing detail page.
 */
export const SPECS_RESERVED_FIELD_KEYS = new Set([
  'year',
  'manufacturer',
  'brand',
  'make',
  'model',
  'condition',
  'category',
  'equipment category',
  'listing category',
  'product category',
  'category name',
])

function normalizeSpecKey(key: string): string {
  return key.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function isReservedSpecKey(key: string): boolean {
  const normalized = normalizeSpecKey(key)
  if (SPECS_RESERVED_FIELD_KEYS.has(normalized)) return true
  // Catch "Category", "Equipment Category", etc. even with punctuation
  const compact = normalized.replace(/[^a-z0-9]/g, '')
  return compact === 'category' || compact.endsWith('category')
}

export function isInternalSpecKey(key: string): boolean {
  return SPECS_INTERNAL_KEYS.has(normalizeSpecKey(key))
}

/** Remove dedicated-field duplicates and internal keys from AI-generated specs. */
export function sanitizeAiSpecs(
  specs: Record<string, string> | null | undefined,
): Record<string, string> | null {
  if (!specs || typeof specs !== 'object') return null

  const cleaned: Record<string, string> = {}
  for (const [key, value] of Object.entries(specs)) {
    const normalized = normalizeSpecKey(key)
    if (SPECS_INTERNAL_KEYS.has(normalized)) {
      cleaned[key] = String(value)
      continue
    }
    if (isReservedSpecKey(key)) continue
    const trimmed = value != null ? String(value).trim() : ''
    if (!trimmed) continue
    cleaned[key] = trimmed
  }

  return Object.keys(cleaned).length > 0 ? cleaned : null
}

/** Merge sanitized AI specs with preserved internal keys (e.g. seller_prompt). */
export function mergeListingSpecs(
  existing: Record<string, unknown> | null | undefined,
  generated: Record<string, string> | null | undefined,
): Record<string, string> | null {
  const preserved: Record<string, string> = {}
  if (existing && typeof existing === 'object') {
    for (const key of Array.from(SPECS_INTERNAL_KEYS)) {
      const match = Object.entries(existing).find(([k]) => normalizeSpecKey(k) === key)
      if (match && match[1] != null && String(match[1]).trim()) {
        preserved[match[0]] = String(match[1]).trim()
      }
    }
  }

  const sanitized = sanitizeAiSpecs(generated) ?? {}
  const merged = { ...sanitized, ...preserved }
  return Object.keys(merged).length > 0 ? merged : null
}

/** Functional / technical entries from specs JSON for the public specifications grid. */
export function getFunctionalSpecsEntries(
  specs: Record<string, unknown> | null | undefined,
): { label: string; value: string }[] {
  if (!specs || typeof specs !== 'object') return []

  return Object.entries(specs)
    .filter(([key, value]) => {
      if (isReservedSpecKey(key) || isInternalSpecKey(key)) return false
      return value != null && String(value).trim() !== ''
    })
    .map(([key, value]) => ({ label: key, value: String(value) }))
}
