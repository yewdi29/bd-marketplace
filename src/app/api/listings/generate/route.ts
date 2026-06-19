import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { resolveCategoryAndIndustryIds } from '@/lib/categoryResolver'

const SYSTEM_PROMPT = `You are an expert equipment listing assistant for Black Diamond Marketplace, a premium B2B heavy equipment marketplace for the oil and gas industry.

The user will describe a piece of equipment in plain language. Extract all relevant details and return them as a single valid JSON object. Return ONLY the raw JSON — no markdown, no explanation, no code fences.

Use exactly these field names and value constraints:

{
  "title": "Equipment title following this exact pattern: [Manufacturer] [Model] [Equipment Type] — [Key Spec]. Max 80 characters. The key spec after the em dash must be the single most important differentiator — size, grade, PSI rating, or condition if nothing else is available. If manufacturer is unknown, use the equipment type as the first word. Never use generic sales words like 'Quality', 'Excellent', 'Available', or 'For Sale'. Always include manufacturer if mentioned. Always include model or grade if mentioned. Title must read like a professional equipment catalog entry, not a sales pitch. Examples: 'National 12-P-160 Drilling Rig — Full Package', 'Cameron Type U BOP Stack — 13⅝\" 5000 PSI', 'Gardner Denver PZ-11 Triplex Pump — Good Condition', '5\" Grade S-135 Drill Pipe — 19.5 lbs/ft Range 2'.",
  "category": "One of exactly: drilling_rig | drill_pipe | drill_collar | blowout_preventer | wellhead | pumping_unit | artificial_lift | wireline | coiled_tubing | completion_equipment | production_equipment | compressor | separator | tank | flowline | electrical | safety | rental_tools | other",
  "manufacturer": "Manufacturer or brand name, or null if unknown",
  "model": "Model number or name, or null if unknown",
  "year": 2012 (integer year, or null if unknown),
  "condition": "One of exactly: new | like_new | good | fair | parts_only",
  "price": 75000 (number, no currency symbol, or null if not mentioned),
  "price_unit": "One of exactly: total | per_foot | per_piece | per_ton | per_set | per_meter. Default to 'total' unless the description explicitly mentions per-unit pricing (e.g. '$25 per foot', '$150/piece', '$500 per ton'). Use 'total' for any lump-sum or full-lot price.",
  "location_city": "City name, or null if not mentioned",
  "location_state": "US state two-letter abbreviation (e.g. TX), or null if not mentioned",
  "description": "Professional 3–5 sentence listing description for the public marketplace page. Highlight key specs, condition, and end with a call to action. Optimized for oil and gas buyers.",
  "meta_description": "Single sentence, 130–160 characters, SEO meta description for search engines.",
  "tags": ["array", "of", "relevant", "keyword", "strings"],
  "specs": {"Size": "5\"", "Grade": "S-135"} (flat key-value object of all equipment specs mentioned — use human-readable keys like "Size", "Grade", "Weight per foot", "Connection type", "Range", "Horsepower", "Pressure rating", "Capacity", "API standard", "OD", "ID", "Wall thickness", "Drive type", "Stroke length", "Hook load", "Drawworks", "BHP", "RPM" etc. Only include specs the seller actually mentioned, never invent or assume values. Use null if no additional specs beyond the basic fields were mentioned.)
}`

interface ClaudeGenerated {
  title: string
  category: string
  manufacturer: string | null
  model: string | null
  year: number | null
  condition: string
  price: number | null
  price_unit: string | null
  location_city: string | null
  location_state: string | null
  description: string
  meta_description: string
  tags: string[]
  specs: Record<string, string> | null
}

// POST /api/listings/generate
// Calls Claude to extract structured listing data from a free-text description.
// PATCHes the draft listing with all fields.
// Returns all fields EXCEPT meta_description (backend-only).
export async function POST(request: NextRequest) {
  const body = await request.json() as { prompt?: string; listing_id?: string }
  const { prompt, listing_id } = body

  if (!prompt || !listing_id) {
    return NextResponse.json({ error: 'prompt and listing_id are required' }, { status: 400 })
  }
  if (prompt.trim().length < 10) {
    return NextResponse.json({ error: 'Description is too short. Tell us more about the equipment.' }, { status: 400 })
  }

  // Auth check
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

  // Verify ownership of the draft
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

  // Call Claude API — wrapped so any network failure returns clean JSON (not HTML)
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
        system: SYSTEM_PROMPT,
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

  // Parse JSON — handle if Claude wraps it in a code block
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

  // Re-derive category_id/industry_id from the generated title/category
  const resolvedTitle    = generated.title || 'Untitled Draft'
  const resolvedCategory = generated.category || 'other'
  const { category_id, industry_id } = await resolveCategoryAndIndustryIds(
    adminClient, resolvedTitle, resolvedCategory
  )

  // PATCH the draft with all generated fields (including meta_description for SEO)
  const { error: updateError } = await adminClient
    .from('listings')
    .update({
      title: resolvedTitle,
      category: resolvedCategory,
      category_id,
      industry_id,
      manufacturer: generated.manufacturer ?? null,
      model: generated.model ?? null,
      year: generated.year ?? null,
      condition: generated.condition || 'good',
      price: generated.price ?? 0,
      price_unit: generated.price_unit ?? 'total',
      price_visible: generated.price != null,
      location_city: generated.location_city ?? null,
      location_state: generated.location_state ?? null,
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

  // Return all fields EXCEPT meta_description — that is backend-only
  const { meta_description: _omit, ...publicFields } = generated
  return NextResponse.json({ listing: { ...publicFields, price: generated.price ?? 0 } })
}
