import { z } from 'zod'

const CONDITION_VALUES = ['new', 'like_new', 'good', 'fair', 'parts_only'] as const
const PRICE_UNIT_VALUES = ['total', 'per_foot', 'per_piece', 'per_ton', 'per_set', 'per_meter'] as const

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

/** JSON Schema for Anthropic tool-use `save_listing` input. */
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
      type: ['object', 'null'],
      additionalProperties: { type: 'string' },
      description: 'Stated technical spec names to values, or null if none',
    },
    missing_info: {
      type: 'array',
      maxItems: 5,
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

export function extractSaveListingToolInput(content: unknown): unknown {
  if (!Array.isArray(content)) return null
  for (const block of content) {
    if (
      typeof block === 'object' &&
      block !== null &&
      (block as { type?: string }).type === 'tool_use' &&
      (block as { name?: string }).name === 'save_listing'
    ) {
      return (block as { input?: unknown }).input ?? null
    }
  }
  return null
}
