import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { loadLocationTaxonomy } from '@/lib/locationResolver'
import { resolveAiTaxonomy } from '@/lib/listingTaxonomyUpdate'

function buildSystemPrompt(taxonomy: {
  industries: { name: string; slug: string }[]
  categories: { name: string; slug: string; industrySlugs: string[] }[]
  countries: { name: string; slug: string }[]
  states: { name: string; code: string | null; countrySlug: string }[]
}): string {
  const industryList = taxonomy.industries
    .map(i => `  - ${i.name} (slug: ${i.slug})`)
    .join('\n')

  const categoryList = taxonomy.categories
    .map(c => `  - ${c.name} (slug: ${c.slug}; industries: ${c.industrySlugs.join(', ')})`)
    .join('\n')

  const countryList = taxonomy.countries
    .map(c => `  - ${c.name} (slug: ${c.slug})`)
    .join('\n')

  const stateList = taxonomy.states
    .slice(0, 80)
    .map(s => `  - ${s.name}${s.code ? ` (${s.code})` : ''} — ${s.countrySlug}`)
    .join('\n')

  return `You are an expert equipment listing assistant for Black Diamond Marketplace, a premium B2B heavy equipment marketplace serving oil & gas, construction, mining, agriculture, and trucking.

The user will describe a piece of equipment in plain language. Extract all relevant details and return them as a single valid JSON object. Return ONLY the raw JSON — no markdown, no explanation, no code fences.

Use exactly these field names and value constraints:

{
  "title": "Equipment title — see TITLE RULES below for the exact required structure.",
  "category": "Legacy oilfield category slug — one of: drilling_rig | drill_pipe | drill_collar | blowout_preventer | wellhead | pumping_unit | artificial_lift | wireline | coiled_tubing | completion_equipment | production_equipment | compressor | separator | tank | flowline | electrical | safety | rental_tools | other. Use only as fallback when industry_slug/category_slug cannot be determined.",
  "industry_slug": "One of the industry slugs below, or null if you cannot confidently classify the equipment.",
  "category_slug": "One of the category slugs below that belongs to the chosen industry, or null if you cannot confidently classify.",
  "manufacturer": "Manufacturer or brand name, or null if unknown",
  "model": "Model number or name, or null if unknown",
  "year": 2012,
  "condition": "One of exactly: new | like_new | good | fair | parts_only",
  "price": 75000,
  "price_unit": "One of exactly: total | per_foot | per_piece | per_ton | per_set | per_meter",
  "country_slug": "One of: united-states | canada | mexico — infer from the location mentioned. Use null if no location is mentioned or you cannot determine the country confidently.",
  "location_city": "City name, or null if not mentioned",
  "location_state": "For United States: 2-letter state code (e.g. TX). For Canada: full province name (e.g. Alberta, Ontario). For Mexico: null. Null if not mentioned or uncertain.",
  "description": "Professional 3–5 sentence listing description for the public marketplace page.",
  "meta_description": "Single sentence, 130–160 characters, SEO meta description.",
  "tags": ["array", "of", "relevant", "keyword", "strings"],
  "specs": {"Size": "5\\""}
}

TITLE RULES:
Build the title using this exact format:
[Year or Size] [Brand/Manufacturer] [Equipment Type] — [3-word max descriptor]

Main title elements (before the dash):
- Lead with year if known, or size/dimension if no year and size is the primary identifier (e.g. "2019", "42\"", "5½\"").
- Follow with brand or manufacturer if known — omit entirely if unknown, never guess.
- Follow with the standard industry equipment type name matching the category taxonomy below. This element is required.
- Keep the full title under 60 characters where possible.
- Never use filler words like "Heavy Duty", "High Quality", "Great Condition", or vague superlatives — every word must carry real informational value.

Descriptor rules (after the dash — omit the entire dash and descriptor if no meaningful one exists):
- Maximum 3 words — never more.
- Must describe exactly ONE of the following:
  - Condition note: "Low Hours", "Fair Condition", "Needs Work", "Like New"
  - Quantity: "255 Joints", "3 Units", "12 Sets"
  - Single key spec: "4WD", "Extended Reach", "Tier 4", "Sealed Bearing"
- Never use marketing language, adjectives like "excellent" or "great", or full sentences.
- If no meaningful 3-word descriptor exists from the seller's description, omit the dash and descriptor entirely — do not force one.

Correct examples:
- 2019 Caterpillar 336 Excavator — Low Hours
- 42" Pipe Racks — 255 Joints
- 2018 Kenworth T800 Flatbed — Needs Engine
- 5½" Drill Pipe — Sealed Bearing
- 2015 Komatsu D65 Crawler Dozer — Tier 4
- John Deere 8R Tractor (no descriptor if nothing meaningful to add)

Incorrect examples to avoid:
- 2019 Caterpillar 336 Excavator — Enclosed Operator Cab with Hydraulic Raise System (descriptor too long)
- High Quality Drill Pipe in Great Condition (no year/size, marketing language)
- 2018 Kenworth T800 Heavy Duty Flatbed Truck — Excellent Condition Ready to Work (filler words, descriptor too long)

LOCATION RULES:
- If the seller mentions a US city/state (e.g. "Midland, Texas" or "Houston, TX"), set country_slug to united-states and location_state to the 2-letter code.
- If the seller mentions a Canadian city/province (e.g. "Calgary, Alberta" or "Toronto, Ontario"), set country_slug to canada and location_state to the full province name.
- If the seller mentions Mexico or a Mexican city without a province, set country_slug to mexico and leave location_state null.
- If location is ambiguous or not mentioned, set country_slug, location_city, and location_state all to null — do NOT guess.

INDUSTRY & CATEGORY RULES:
- Classify equipment into the best matching industry_slug and category_slug from the lists below.
- category_slug MUST belong to the chosen industry.
- If you cannot confidently match any category, set both industry_slug and category_slug to null.

INDUSTRIES:
${industryList}

CATEGORIES:
${categoryList}

COUNTRIES:
${countryList}

STATES & PROVINCES (sample — match mentioned locations against these):
${stateList}`
}

interface ClaudeGenerated {
  title: string
  category: string
  industry_slug: string | null
  category_slug: string | null
  manufacturer: string | null
  model: string | null
  year: number | null
  condition: string
  price: number | null
  price_unit: string | null
  country_slug: string | null
  location_city: string | null
  location_state: string | null
  description: string
  meta_description: string
  tags: string[]
  specs: Record<string, string> | null
}

// POST /api/listings/generate
export async function POST(request: NextRequest) {
  const body = await request.json() as { prompt?: string; listing_id?: string }
  const { prompt, listing_id } = body

  if (!prompt || !listing_id) {
    return NextResponse.json({ error: 'prompt and listing_id are required' }, { status: 400 })
  }
  if (prompt.trim().length < 10) {
    return NextResponse.json({ error: 'Description is too short. Tell us more about the equipment.' }, { status: 400 })
  }

  const cookieStore = await cookies()
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: listing } = await adminClient
    .from('listings')
    .select('seller_id, status')
    .eq('id', listing_id)
    .single()

  if (!listing || listing.seller_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (listing.status !== 'draft') {
    return NextResponse.json({ error: 'Can only generate for draft listings' }, { status: 400 })
  }

  // Build taxonomy-aware system prompt
  const [locationTaxonomy, industriesRes, categoriesRes] = await Promise.all([
    loadLocationTaxonomy(adminClient),
    adminClient.from('industries').select('name, slug').order('sort_order'),
    adminClient
      .from('categories')
      .select('name, slug, category_industries(industries(slug))')
      .order('name'),
  ])

  type CatRow = {
    name: string
    slug: string
    category_industries: { industries: { slug: string } | { slug: string }[] | null }[] | null
  }
  const categories = ((categoriesRes.data ?? []) as unknown as CatRow[]).map(row => ({
    name: row.name,
    slug: row.slug,
    industrySlugs: (row.category_industries ?? []).flatMap(ci => {
      const ind = ci.industries
      if (!ind) return []
      return Array.isArray(ind) ? ind.map(i => i.slug) : [ind.slug]
    }),
  }))

  const countryById = new Map(locationTaxonomy.countries.map(c => [c.id, c.slug]))
  const regionCountry = new Map(locationTaxonomy.regions.map(r => [r.id, r.country_id]))

  const statesForPrompt = locationTaxonomy.states.map(s => {
    const regionId = s.region_id
    const countryId = regionCountry.get(regionId)
    const countrySlug = countryId ? countryById.get(countryId) ?? '' : ''
    return { name: s.name, code: s.code, countrySlug }
  })

  const systemPrompt = buildSystemPrompt({
    industries: (industriesRes.data ?? []) as { name: string; slug: string }[],
    categories,
    countries: locationTaxonomy.countries,
    states: statesForPrompt,
  })

  let anthropicRes: Response
  try {
    anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
  } catch (err) {
    console.error('Anthropic fetch failed:', err)
    return NextResponse.json({ error: 'Could not reach the AI service. Please try again.' }, { status: 502 })
  }

  if (!anthropicRes.ok) {
    const errText = await anthropicRes.text()
    console.error('Anthropic API error:', anthropicRes.status, errText)
    return NextResponse.json({ error: 'AI generation failed. Please try again.' }, { status: 502 })
  }

  let anthropicData: { content: { type: string; text: string }[] }
  try {
    anthropicData = await anthropicRes.json() as { content: { type: string; text: string }[] }
  } catch (err) {
    console.error('Failed to parse Anthropic response:', err)
    return NextResponse.json({ error: 'Unexpected response from AI. Please try again.' }, { status: 502 })
  }

  const rawText = anthropicData.content?.[0]?.text?.trim() ?? ''

  let generated: ClaudeGenerated
  try {
    generated = JSON.parse(rawText)
  } catch {
    try {
      const match = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/) ?? rawText.match(/(\{[\s\S]*\})/)
      if (!match) throw new Error('No JSON found in response')
      generated = JSON.parse(match[1])
    } catch {
      console.error('Could not parse Claude response:', rawText)
      return NextResponse.json({ error: 'Could not parse AI response. Please try again.' }, { status: 502 })
    }
  }

  const resolvedTitle = generated.title || 'Untitled Draft'
  const taxonomy = await resolveAiTaxonomy(adminClient, {
    country_slug: generated.country_slug,
    location_city: generated.location_city,
    location_state: generated.location_state,
    industry_slug: generated.industry_slug,
    category_slug: generated.category_slug,
    title: resolvedTitle,
    category: generated.category,
  })

  const { error: updateError } = await adminClient
    .from('listings')
    .update({
      title: resolvedTitle,
      category: taxonomy.legacyCategory,
      category_id: taxonomy.category_id,
      industry_id: taxonomy.industry_id,
      country_id: taxonomy.country_id,
      region_id: taxonomy.region_id,
      state_id: taxonomy.state_id,
      manufacturer: generated.manufacturer ?? null,
      model: generated.model ?? null,
      year: generated.year ?? null,
      condition: generated.condition || 'good',
      price: generated.price ?? 0,
      price_unit: generated.price_unit ?? 'total',
      price_visible: generated.price != null,
      location_city: taxonomy.location_city,
      location_state: taxonomy.location_state,
      description: generated.description ?? null,
      meta_description: generated.meta_description ?? null,
      tags: generated.tags ?? [],
      specs: generated.specs ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', listing_id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  const { meta_description: _omit, ...publicFields } = generated
  return NextResponse.json({
    listing: {
      ...publicFields,
      price: generated.price ?? 0,
      category: taxonomy.legacyCategory,
      country_id: taxonomy.country_id,
      region_id: taxonomy.region_id,
      state_id: taxonomy.state_id,
      industry_id: taxonomy.industry_id,
      category_id: taxonomy.category_id,
      location_city: taxonomy.location_city,
      location_state: taxonomy.location_state,
    },
  })
}
