import { z } from 'zod'

const CONDITION_VALUES = ['new', 'like_new', 'good', 'fair', 'parts_only'] as const
const PRICE_UNIT_VALUES = ['total', 'per_foot', 'per_piece', 'per_ton', 'per_set', 'per_meter'] as const

type ConditionValue = (typeof CONDITION_VALUES)[number]
type PriceUnitValue = (typeof PRICE_UNIT_VALUES)[number]

const nullableString = z.string().nullable()
const nullableNumber = z.number().nullable()

export const generatedListingSchema = z.object({
  title: z.string(),
  category: z.string(),
  industry_slug: nullableString,
  category_slug: nullableString,
  manufacturer: nullableString,
  model: nullableString,
  year: z.number().int().nullable(),
  condition: z.enum(CONDITION_VALUES).nullable(),
  price: nullableNumber,
  price_unit: z.enum(PRICE_UNIT_VALUES).nullable(),
  price_hidden_requested: z.boolean(),
  price_terms: nullableString,
  quantity: nullableString,
  hours: nullableString,
  country_slug: nullableString,
  location_city: nullableString,
  location_state: nullableString,
  description: z.string(),
  meta_description: z.string(),
  tags: z.array(z.string()),
  specs: z.record(z.string()).nullable(),
  missing_info: z.array(z.string()).max(5),
})

export type GeneratedListing = z.infer<typeof generatedListingSchema>

const CONDITION_ALIASES: Record<string, ConditionValue> = {
  new: 'new',
  like_new: 'like_new',
  'like new': 'like_new',
  likenew: 'like_new',
  good: 'good',
  great: 'good',
  excellent: 'good',
  fair: 'fair',
  poor: 'fair',
  parts_only: 'parts_only',
  'parts only': 'parts_only',
  partsonly: 'parts_only',
}

const PRICE_UNIT_ALIASES: Record<string, PriceUnitValue> = {
  total: 'total',
  each: 'per_piece',
  ea: 'per_piece',
  piece: 'per_piece',
  per_piece: 'per_piece',
  'per piece': 'per_piece',
  joint: 'per_piece',
  per_joint: 'per_piece',
  'per joint': 'per_piece',
  foot: 'per_foot',
  per_foot: 'per_foot',
  'per foot': 'per_foot',
  ft: 'per_foot',
  ton: 'per_ton',
  per_ton: 'per_ton',
  'per ton': 'per_ton',
  set: 'per_set',
  per_set: 'per_set',
  'per set': 'per_set',
  meter: 'per_meter',
  per_meter: 'per_meter',
  'per meter': 'per_meter',
  m: 'per_meter',
}

function asNullableString(value: unknown): string | null {
  if (value == null) return null
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed || trimmed.toLowerCase() === 'null') return null
    return trimmed
  }
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return null
}

function asNullableNumber(value: unknown): number | null {
  if (value == null || value === '') return null
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const trimmed = value.trim().toLowerCase()
    if (!trimmed || trimmed === 'null' || trimmed === 'n/a' || trimmed === 'na') return null
    const cleaned = trimmed.replace(/[$,\s]/g, '').replace(/usd$/i, '')
    const parsed = Number(cleaned)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function asNullableYear(value: unknown): number | null {
  const num = asNullableNumber(value)
  if (num == null) return null
  const year = Math.trunc(num)
  if (year < 1900 || year > 2100) return null
  return year
}

function asBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  if (typeof value === 'string') {
    const trimmed = value.trim().toLowerCase()
    if (['true', '1', 'yes', 'y'].includes(trimmed)) return true
    if (['false', '0', 'no', 'n', ''].includes(trimmed)) return false
  }
  return fallback
}

function asStringArray(value: unknown, maxItems?: number): string[] {
  const raw = Array.isArray(value)
    ? value
    : typeof value === 'string' && value.trim()
      ? value.split(/[,;]/).map(part => part.trim())
      : []
  const cleaned = raw
    .map(item => (item == null ? '' : String(item).trim()))
    .filter(Boolean)
  return maxItems != null ? cleaned.slice(0, maxItems) : cleaned
}

/** Accept object map or strict-mode [{name,value}] array from the tool. */
function asSpecs(value: unknown): Record<string, string> | null {
  if (value == null || value === '') return null

  if (Array.isArray(value)) {
    const out: Record<string, string> = {}
    for (const item of value) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) continue
      const row = item as Record<string, unknown>
      const name = asNullableString(row.name ?? row.key)
      const val = asNullableString(row.value)
      if (!name || !val) continue
      out[name] = val
    }
    return Object.keys(out).length > 0 ? out : null
  }

  if (typeof value !== 'object') return null
  const out: Record<string, string> = {}
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    const k = String(key).trim()
    if (!k) continue
    if (raw == null) continue
    const v = String(raw).trim()
    if (!v || v.toLowerCase() === 'null') continue
    out[k] = v
  }
  return Object.keys(out).length > 0 ? out : null
}

function asCondition(value: unknown): ConditionValue | null {
  const text = asNullableString(value)
  if (!text) return null
  const normalized = text.toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim()
  if (CONDITION_ALIASES[normalized]) return CONDITION_ALIASES[normalized]
  const compact = normalized.replace(/\s+/g, '_')
  if (CONDITION_ALIASES[compact]) return CONDITION_ALIASES[compact]
  for (const [alias, mapped] of Object.entries(CONDITION_ALIASES)) {
    if (normalized.includes(alias)) return mapped
  }
  return null
}

function asPriceUnit(value: unknown): PriceUnitValue | null {
  const text = asNullableString(value)
  if (!text) return null
  const normalized = text.toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim()
  if (PRICE_UNIT_ALIASES[normalized]) return PRICE_UNIT_ALIASES[normalized]
  const compact = normalized.replace(/\s+/g, '_')
  if (PRICE_UNIT_ALIASES[compact]) return PRICE_UNIT_ALIASES[compact]
  for (const [alias, mapped] of Object.entries(PRICE_UNIT_ALIASES)) {
    if (normalized.includes(alias)) return mapped
  }
  return null
}

function parseJsonObject(value: unknown): Record<string, unknown> | null {
  if (value != null && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed.startsWith('{')) return null
  try {
    const parsed = JSON.parse(trimmed) as unknown
    if (parsed != null && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>
    }
  } catch {
    return null
  }
  return null
}

/**
 * Coerce common Anthropic tool-use shape drift before Zod.
 * Also maps strict-mode specs [{name,value}] into a string record.
 */
export function normalizeSaveListingToolInput(input: unknown): unknown {
  const raw = parseJsonObject(input)
  if (!raw) return input

  return {
    ...raw,
    title: asNullableString(raw.title) ?? '',
    category: asNullableString(raw.category) ?? 'other',
    industry_slug: asNullableString(raw.industry_slug),
    category_slug: asNullableString(raw.category_slug),
    manufacturer: asNullableString(raw.manufacturer),
    model: asNullableString(raw.model),
    year: asNullableYear(raw.year),
    condition: asCondition(raw.condition),
    price: asNullableNumber(raw.price),
    price_unit: asPriceUnit(raw.price_unit),
    price_hidden_requested: asBoolean(raw.price_hidden_requested, false),
    price_terms: asNullableString(raw.price_terms),
    quantity: asNullableString(raw.quantity),
    hours: asNullableString(raw.hours),
    country_slug: asNullableString(raw.country_slug),
    location_city: asNullableString(raw.location_city),
    location_state: asNullableString(raw.location_state),
    description: asNullableString(raw.description) ?? '',
    meta_description: asNullableString(raw.meta_description) ?? '',
    tags: asStringArray(raw.tags),
    specs: asSpecs(raw.specs),
    missing_info: asStringArray(raw.missing_info, 5),
  }
}

/**
 * JSON Schema for Anthropic tool-use `save_listing` input.
 * Specs are [{name,value}] pairs. Strict mode is intentionally off: this schema
 * has too many nullable unions for Anthropic's grammar compiler (400
 * "Schema is too complex"). Drift is handled by normalizeSaveListingToolInput.
 */
export const saveListingInputSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    title: { type: 'string', description: 'Listing title per TITLE RULES.' },
    category: {
      type: 'string',
      description:
        'Legacy oilfield category slug — one of: drilling_rig | drilling_rig_parts | drill_pipe | drill_collar | blowout_preventer | wellhead | pumping_unit | artificial_lift | wireline | coiled_tubing | completion_equipment | production_equipment | compressor | separator | tank | flowline | electrical | safety | rental_tools | other.',
    },
    industry_slug: { type: ['string', 'null'] },
    category_slug: { type: ['string', 'null'] },
    manufacturer: { type: ['string', 'null'] },
    model: { type: ['string', 'null'] },
    year: { type: ['integer', 'null'], description: '4-digit year, or null if not stated' },
    condition: {
      type: ['string', 'null'],
      enum: [...CONDITION_VALUES, null],
      description: 'new | like_new | good | fair | parts_only | null',
    },
    price: { type: ['number', 'null'], description: 'Numeric asking price, or null if not stated' },
    price_unit: {
      type: ['string', 'null'],
      enum: [...PRICE_UNIT_VALUES, null],
    },
    price_hidden_requested: {
      type: 'boolean',
      description: 'True if the seller says call/contact for price or price on request',
    },
    price_terms: { type: ['string', 'null'], description: 'e.g. OBO, or null' },
    quantity: { type: ['string', 'null'], description: 'Quantity as stated, or null' },
    hours: { type: ['string', 'null'], description: 'Hours as stated, or null' },
    country_slug: { type: ['string', 'null'] },
    location_city: { type: ['string', 'null'] },
    location_state: { type: ['string', 'null'] },
    description: { type: 'string', description: 'Preserved seller text per DESCRIPTION RULES' },
    meta_description: {
      type: 'string',
      description: 'Plain one-sentence summary using only stated facts; no price if price_hidden_requested',
    },
    tags: { type: 'array', items: { type: 'string' } },
    specs: {
      type: ['array', 'null'],
      description:
        'Stated technical specs as {name,value} pairs, or null if none. Example: [{"name":"Size","value":"5\\""},{"name":"Range","value":"Range 2"}]',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          name: { type: 'string' },
          value: { type: 'string' },
        },
        required: ['name', 'value'],
      },
    },
    missing_info: {
      type: 'array',
      items: { type: 'string' },
      description: 'Up to 5 unstated spec names, e.g. Grade, Weight per foot, Connection type',
    },
  },
  required: [
    'title',
    'category',
    'industry_slug',
    'category_slug',
    'manufacturer',
    'model',
    'year',
    'condition',
    'price',
    'price_unit',
    'price_hidden_requested',
    'price_terms',
    'quantity',
    'hours',
    'country_slug',
    'location_city',
    'location_state',
    'description',
    'meta_description',
    'tags',
    'specs',
    'missing_info',
  ],
} as const

export const SAVE_LISTING_TOOL = {
  name: 'save_listing',
  description:
    'Save the extracted listing fields and the preserved seller description. Use null for any field the seller did not state. Never invent values.',
  input_schema: saveListingInputSchema,
}

export function formatZodError(error: z.ZodError): string {
  return error.issues.map(issue => `${issue.path.join('.') || '(root)'}: ${issue.message}`).join('; ')
}

function looksLikeListingFields(value: unknown): value is Record<string, unknown> {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) return false
  const obj = value as Record<string, unknown>
  return typeof obj.title === 'string' || typeof obj.description === 'string'
}

export function extractSaveListingToolInput(content: unknown): unknown {
  if (!Array.isArray(content)) return null

  for (const block of content) {
    if (
      typeof block === 'object' &&
      block !== null &&
      (block as { type?: string }).type === 'tool_use' &&
      (block as { name?: string }).name === 'save_listing'
    ) {
      const rawInput = (block as { input?: unknown }).input
      if (rawInput == null) return null
      if (typeof rawInput === 'string') {
        return parseJsonObject(rawInput)
      }
      return rawInput
    }
  }

  // Fallback if the model returns JSON text instead of tool_use.
  for (const block of content) {
    if (
      typeof block === 'object' &&
      block !== null &&
      (block as { type?: string }).type === 'text' &&
      typeof (block as { text?: unknown }).text === 'string'
    ) {
      const text = (block as { text: string }).text.trim()
      const start = text.indexOf('{')
      const end = text.lastIndexOf('}')
      if (start === -1 || end <= start) continue
      const parsed = parseJsonObject(text.slice(start, end + 1))
      if (parsed && looksLikeListingFields(parsed)) return parsed
    }
  }

  return null
}
