import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { loadLocationTaxonomy } from '@/lib/locationResolver'
import { resolveAiTaxonomy } from '@/lib/listingTaxonomyUpdate'
import { canManageListing } from '@/lib/listings/canManageListing'
import { mergeListingSpecs, sanitizeAiSpecs } from '@/lib/listings/listingSpecs'
import { buildSystemPrompt, wrapSellerInput } from '@/lib/listings/generatePrompt'
import {
  extractSaveListingToolInput,
  formatZodError,
  generatedListingSchema,
  SAVE_LISTING_TOOL,
  type GeneratedListing,
} from '@/lib/listings/generateListingSchema'
import {
  checkGeneratedDescription,
  stripPriceFromMetaAndTags,
  trimSellerFallback,
} from '@/lib/listings/checkGeneratedDescription'

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-5'
const MAX_TOKENS = 2048

type AnthropicMessageResponse = {
  content: unknown
}

async function callSaveListing(
  systemPrompt: string,
  userMessage: string,
): Promise<{ ok: true; listing: GeneratedListing } | { ok: false; status: number; error: string }> {
  async function once(message: string): Promise<
    { ok: true; listing: GeneratedListing } | { ok: false; retryHint?: string; error: string; status: number }
  > {
    let anthropicRes: Response
    try {
      anthropicRes = await fetch(ANTHROPIC_URL, {
        method: 'POST',
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY!,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          system: systemPrompt,
          tools: [SAVE_LISTING_TOOL],
          tool_choice: { type: 'tool', name: 'save_listing' },
          messages: [{ role: 'user', content: message }],
        }),
      })
    } catch (err) {
      console.error('Anthropic fetch failed:', err)
      return { ok: false, status: 502, error: 'Could not reach the AI service. Please try again.' }
    }

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text()
      console.error('Anthropic API error:', anthropicRes.status, errText)
      return { ok: false, status: 502, error: 'AI generation failed. Please try again.' }
    }

    let anthropicData: AnthropicMessageResponse
    try {
      anthropicData = await anthropicRes.json() as AnthropicMessageResponse
    } catch (err) {
      console.error('Failed to parse Anthropic response:', err)
      return { ok: false, status: 502, error: 'Unexpected response from AI. Please try again.' }
    }

    const toolInput = extractSaveListingToolInput(anthropicData.content)
    if (toolInput == null) {
      return {
        ok: false,
        status: 502,
        retryHint: 'Previous response did not call save_listing. Call save_listing with every required field.',
        error: 'Could not parse AI response. Please try again.',
      }
    }

    const parsed = generatedListingSchema.safeParse(toolInput)
    if (!parsed.success) {
      return {
        ok: false,
        status: 502,
        retryHint: `Previous save_listing input failed validation: ${formatZodError(parsed.error)}. Call save_listing again with corrected fields.`,
        error: 'Could not parse AI response. Please try again.',
      }
    }

    return { ok: true, listing: parsed.data }
  }

  const first = await once(userMessage)
  if (first.ok) return first
  if (!first.retryHint) return { ok: false, status: first.status, error: first.error }

  const retry = await once(`${userMessage}\n\n${first.retryHint}`)
  if (retry.ok) return retry
  return { ok: false, status: 502, error: retry.error }
}

function applyHiddenPrice(listing: GeneratedListing): GeneratedListing {
  if (!listing.price_hidden_requested) return listing
  const stripped = stripPriceFromMetaAndTags(listing.meta_description, listing.tags)
  return {
    ...listing,
    meta_description: stripped.meta_description,
    tags: stripped.tags,
  }
}

function sanitizeGenerated(listing: GeneratedListing): GeneratedListing {
  return {
    ...listing,
    specs: sanitizeAiSpecs(listing.specs),
  }
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

  const allowed = await canManageListing(authClient, listing_id, user.id)
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: listing } = await adminClient
    .from('listings')
    .select('seller_id, status, specs')
    .eq('id', listing_id)
    .single()

  if (!listing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (listing.status !== 'draft') {
    return NextResponse.json({ error: 'Can only generate for draft listings' }, { status: 400 })
  }

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

  const wrapped = wrapSellerInput(prompt)
  const generatedResult = await callSaveListing(systemPrompt, wrapped)
  if (!generatedResult.ok) {
    return NextResponse.json({ error: generatedResult.error }, { status: generatedResult.status })
  }

  let generated = sanitizeGenerated(generatedResult.listing)

  const preservation = checkGeneratedDescription(prompt, generated.description)
  if (preservation.flagged) {
    const issueList = preservation.issues.map(issue => `- ${issue}`).join('\n')
    const retryHint =
      `The previous description failed preservation checks:\n${issueList}\n` +
      'Call save_listing again. Follow DESCRIPTION RULES: keep the seller\'s own text, voice, bullets, order, and do not add words they did not write.'
    const retried = await callSaveListing(systemPrompt, `${wrapped}\n\n${retryHint}`)
    if (retried.ok) {
      generated = sanitizeGenerated(retried.listing)
      const stillFlagged = checkGeneratedDescription(prompt, generated.description)
      if (stillFlagged.flagged) {
        generated = { ...generated, description: trimSellerFallback(prompt) }
      }
    } else {
      generated = { ...generated, description: trimSellerFallback(prompt) }
    }
  }

  generated = applyHiddenPrice(generated)

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

  const mergedSpecs = mergeListingSpecs(
    listing.specs as Record<string, unknown> | null,
    generated.specs,
  )

  const priceVisible = generated.price != null && !generated.price_hidden_requested
  // listings.price is NOT NULL; 0 is the draft unset sentinel when the seller stated no price.
  const priceForDb = generated.price ?? 0

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
      condition: generated.condition ?? null,
      price: priceForDb,
      price_unit: generated.price_unit ?? 'total',
      price_visible: priceVisible,
      location_city: taxonomy.location_city,
      location_state: taxonomy.location_state,
      description: generated.description ?? null,
      meta_description: generated.meta_description ?? null,
      tags: generated.tags ?? [],
      specs: mergedSpecs,
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
      specs: mergedSpecs,
      price: generated.price ?? null,
      price_visible: priceVisible,
      condition: generated.condition ?? null,
      missing_info: generated.missing_info,
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
