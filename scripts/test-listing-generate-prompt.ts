/**
 * Smoke-test the listing generate prompt against a sample seller input.
 * Requires ANTHROPIC_API_KEY in .env.local.
 *
 * Usage: npx tsx scripts/test-listing-generate-prompt.ts
 */

import { readFileSync } from 'fs'

function loadEnvLocal() {
  try {
    const raw = readFileSync('.env.local', 'utf8')
    for (const line of raw.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
      if (!process.env[key]) process.env[key] = value
    }
  } catch {
    // ignore
  }
}

loadEnvLocal()

const SAMPLE_PROMPT = `2012 Caterpillar 336E excavator for sale in Midland, TX. Asking $185,000.
Well maintained. Serviced every 250 hours. Includes a hydraulic thumb attachment.
Low hours, runs great. Selling because we're downsizing the fleet. Buyer arranges hauling.`

// Minimal system prompt excerpt matching production rules (full prompt is in route.ts)
const SYSTEM = `Return ONLY raw JSON with fields: title, category, industry_slug, category_slug, manufacturer, model, year, condition, price, price_unit, country_slug, location_city, location_state, description, meta_description, tags, specs.

DESCRIPTION RULES: First person as seller. Never invent details. "Well maintained" must stay vague if that's all seller said — but "serviced every 250 hours" may be stated because seller provided it. Attachments/logistics in description ONLY.

SPECS RULES: Never put year, model, manufacturer, brand, condition, or category in specs. Only explicit functional/technical specs.`

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY not set')
    process.exit(1)
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-5',
      max_tokens: 2048,
      system: SYSTEM,
      messages: [{ role: 'user', content: SAMPLE_PROMPT }],
    }),
  })

  if (!res.ok) {
    console.error('API error', res.status, await res.text())
    process.exit(1)
  }

  const data = await res.json() as { content: { text: string }[] }
  const raw = data.content?.[0]?.text?.trim() ?? ''
  const parsed = JSON.parse(raw.match(/(\{[\s\S]*\})/)?.[1] ?? raw) as {
    description?: string
    specs?: Record<string, string> | null
    year?: number
    manufacturer?: string
    model?: string
  }

  console.log('=== SAMPLE OUTPUT ===')
  console.log('year (dedicated):', parsed.year)
  console.log('manufacturer:', parsed.manufacturer)
  console.log('model:', parsed.model)
  console.log('\n--- description ---')
  console.log(parsed.description)
  console.log('\n--- specs ---')
  console.log(JSON.stringify(parsed.specs, null, 2))

  const desc = parsed.description ?? ''
  const checks = {
    firstPerson: /\b(I'm|I am|my |we're|we are|our )\b/i.test(desc),
    noThirdPerson: !/\b(the seller|the owner|is offering)\b/i.test(desc),
    mentions250Hours: /250\s*hours/i.test(desc),
    mentionsWellMaintained: /well maintained/i.test(desc),
    mentionsThumb: /thumb/i.test(desc),
    mentionsHauling: /haul/i.test(desc),
    noInventedMaintenanceSchedule: !/\b(every \d+ (days|weeks|months))\b/i.test(desc) || /250\s*hours/i.test(desc),
    specsHasNoYear: !parsed.specs || !Object.keys(parsed.specs).some(k => k.toLowerCase() === 'year'),
    specsHasNoModel: !parsed.specs || !Object.keys(parsed.specs).some(k => k.toLowerCase() === 'model'),
    specsHasNoManufacturer: !parsed.specs || !Object.keys(parsed.specs).some(k => /manufacturer|brand|make/i.test(k)),
    attachmentNotInSpecs: !parsed.specs || !Object.values(parsed.specs).some(v => /thumb|attachment/i.test(String(v))),
  }

  console.log('\n=== CHECKS ===')
  for (const [k, v] of Object.entries(checks)) {
    console.log(`${v ? 'PASS' : 'FAIL'}: ${k}`)
  }
}

main()
