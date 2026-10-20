/**
 * Offline simulation: old Zod-only path vs normalize+Zod (current route).
 * Usage: npx tsx scripts/sim-ai-listing-parse.ts
 */
import {
  extractSaveListingToolInput,
  formatZodError,
  generatedListingSchema,
  normalizeSaveListingToolInput,
} from '../src/lib/listings/generateListingSchema'

type Case = { name: string; content: unknown; expectOk: boolean }

const baseFields = {
  title: '2019 Caterpillar 336 Excavator — Low Hours',
  category: 'other',
  industry_slug: 'construction',
  category_slug: 'excavators',
  manufacturer: 'Caterpillar',
  model: '336',
  year: 2019,
  condition: 'good',
  price: 185000,
  price_unit: 'total',
  price_hidden_requested: false,
  price_terms: null,
  quantity: null,
  hours: '4200',
  country_slug: 'united-states',
  location_city: 'Midland',
  location_state: 'TX',
  description:
    '2019 Caterpillar 336E excavator for sale in Midland, TX. Asking $185,000.\nWell maintained. Low hours, runs great.',
  meta_description: '2019 Caterpillar 336 excavator in Midland TX with low hours.',
  tags: ['excavator', 'Caterpillar', 'Midland'],
  specs: { Hours: '4200' },
  missing_info: ['Operating Weight'],
}

function parseLikeRoute(content: unknown): { ok: true; listing: unknown } | { ok: false; error: string } {
  const toolInput = extractSaveListingToolInput(content)
  if (toolInput == null) {
    return { ok: false, error: 'Could not parse AI response. Please try again.' }
  }
  const normalized = normalizeSaveListingToolInput(toolInput)
  const parsed = generatedListingSchema.safeParse(normalized)
  if (!parsed.success) {
    return { ok: false, error: `Zod: ${formatZodError(parsed.error)}` }
  }
  return { ok: true, listing: parsed.data }
}

function parseOldWay(content: unknown) {
  const toolInput = extractSaveListingToolInput(content)
  if (toolInput == null) {
    return { ok: false as const, error: 'Could not parse AI response. Please try again.' }
  }
  const parsed = generatedListingSchema.safeParse(toolInput)
  if (!parsed.success) {
    return { ok: false as const, error: 'Could not parse AI response. Please try again.' }
  }
  return { ok: true as const, listing: parsed.data }
}

const cases: Case[] = [
  {
    name: 'clean numeric tool_use (baseline)',
    expectOk: true,
    content: [{ type: 'tool_use', name: 'save_listing', id: '1', input: baseFields }],
  },
  {
    name: 'drift: string year/price + numeric specs (original bug)',
    expectOk: true,
    content: [
      {
        type: 'tool_use',
        name: 'save_listing',
        id: '1',
        input: {
          ...baseFields,
          year: '2019',
          price: '$185,000',
          condition: 'great condition',
          price_unit: 'per joint',
          price_hidden_requested: 'false',
          quantity: 200,
          model: '',
          tags: 'excavator, Midland',
          specs: { Hours: 4200, Size: 5 },
          missing_info: ['a', 'b', 'c', 'd', 'e', 'f'],
        },
      },
    ],
  },
  {
    name: 'drift: call-for-price boolean as string',
    expectOk: true,
    content: [
      {
        type: 'tool_use',
        name: 'save_listing',
        id: '1',
        input: {
          ...baseFields,
          price: null,
          price_hidden_requested: 'true',
          price_unit: null,
        },
      },
    ],
  },
  {
    name: 'missing tool_use block',
    expectOk: false,
    content: [{ type: 'text', text: 'here is JSON {...}' }],
  },
]

let fails = 0
for (const c of cases) {
  const oldR = parseOldWay(c.content)
  const newR = parseLikeRoute(c.content)
  const oldStatus = oldR.ok ? 'PASS' : 'FAIL'
  const newStatus = newR.ok ? 'PASS' : 'FAIL'
  const expected = c.expectOk ? 'PASS' : 'FAIL'
  const ok = newStatus === expected
  if (!ok) fails += 1
  console.log(`\n=== ${c.name} ===`)
  console.log(`  before fix: ${oldStatus}`)
  console.log(`  after  fix: ${newStatus} (expected ${expected})`)
  if (newR.ok) {
    const l = newR.listing as Record<string, unknown>
    console.log(
      `  year=${l.year} price=${l.price} condition=${l.condition} unit=${l.price_unit} hidden=${l.price_hidden_requested}`,
    )
  } else {
    console.log(`  error: ${newR.error}`)
  }
  if (c.name.includes('original bug') && !oldR.ok && newR.ok) {
    console.log('  ✓ original bug reproduced pre-fix and fixed post-normalize')
  }
}

console.log(fails ? `\n${fails} case(s) failed` : '\nAll route-parse simulation cases passed')
process.exit(fails ? 1 : 0)
