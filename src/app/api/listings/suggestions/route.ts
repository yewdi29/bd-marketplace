import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

interface Suggestion {
  label: string
  count: number
  type: 'industry' | 'category'
  slug: string
}

interface ListingSuggestion {
  id: string
  title: string
  slug: string
}

type SupabaseClient = ReturnType<typeof createServerClient>

async function countListings(
  supabase: SupabaseClient,
  field: 'industry_id' | 'category_id',
  id: string
): Promise<number> {
  const { count } = await supabase
    .from('listings')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')
    .eq(field, id)
  return count ?? 0
}

// ─── GET /api/listings/suggestions?q= ──────────────────────────────────────────
// Powers the navbar search dropdown — matches against industry names, category
// names, and curated search_keywords, each shown with the count of active
// listings it would surface if applied as an Industry/Category filter. Falls
// back to matching listing titles directly when nothing in the taxonomy has
// any current inventory behind it.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') ?? '').trim()

  if (q.length < 2) return NextResponse.json({ suggestions: [], listings: [] })

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  // ── Name/term matches — substring, case-insensitive, all three in parallel ──
  const [
    { data: matchedIndustries },
    { data: matchedCategories },
    { data: matchedKeywords },
  ] = await Promise.all([
    supabase.from('industries').select('id, name, slug').ilike('name', `%${q}%`).limit(5),
    supabase.from('categories').select('id, name, slug').ilike('name', `%${q}%`).limit(5),
    supabase.from('search_keywords').select('term, category_id, industry_id').ilike('term', `%${q}%`).limit(5),
  ])

  // ── Resolve each match group to suggestions — the three groups, and every
  //    count lookup within a group, all run in parallel ───────────────────────
  const [industrySuggestions, categorySuggestions, keywordSuggestions] = await Promise.all([
    Promise.all(
      (matchedIndustries ?? []).map(async (ind: { id: string; name: string; slug: string }) => ({
        label: ind.name,
        count: await countListings(supabase, 'industry_id', ind.id),
        type: 'industry' as const,
        slug: ind.slug,
      }))
    ),

    Promise.all(
      (matchedCategories ?? []).map(async (cat: { id: string; name: string; slug: string }) => ({
        label: cat.name,
        count: await countListings(supabase, 'category_id', cat.id),
        type: 'category' as const,
        slug: cat.slug,
      }))
    ),

    Promise.all(
      (matchedKeywords ?? []).map(async (kw: { term: string; category_id: string | null; industry_id: string | null }) => {
        if (kw.category_id) {
          const { data: cat } = await supabase
            .from('categories')
            .select('slug')
            .eq('id', kw.category_id)
            .maybeSingle()
          if (!cat) return null
          return {
            label: kw.term,
            count: await countListings(supabase, 'category_id', kw.category_id),
            type: 'category' as const,
            slug: cat.slug,
          }
        }
        if (kw.industry_id) {
          const { data: ind } = await supabase
            .from('industries')
            .select('slug')
            .eq('id', kw.industry_id)
            .maybeSingle()
          if (!ind) return null
          return {
            label: kw.term,
            count: await countListings(supabase, 'industry_id', kw.industry_id),
            type: 'industry' as const,
            slug: ind.slug,
          }
        }
        return null
      })
    ).then(rows => rows.filter((s): s is Suggestion => s !== null)),
  ])

  // ── Merge, dedupe, drop zero-count, rank by count ────────────────────────────
  // A category/industry/keyword with no current inventory is a dead end for
  // the buyer — never surface it.
  const seen = new Set<string>()
  const combined: Suggestion[] = []
  for (const s of [...industrySuggestions, ...categorySuggestions, ...keywordSuggestions]) {
    if (s.count === 0) continue
    const key = `${s.type}:${s.slug}:${s.label}`
    if (seen.has(key)) continue
    seen.add(key)
    combined.push(s)
  }

  combined.sort((a, b) => b.count - a.count)
  const suggestions = combined.slice(0, 8)

  // ── Listing-title fallback — only when the taxonomy match came up empty ────
  let listingMatches: ListingSuggestion[] = []
  if (suggestions.length === 0) {
    const { data: titleRows } = await supabase
      .from('listings')
      .select('id, title, slug')
      .eq('status', 'active')
      .ilike('title', `%${q}%`)
      .limit(3)

    listingMatches = (titleRows ?? []).map((row: { id: string; title: string; slug: string | null }) => ({
      id: row.id,
      title: row.title,
      slug: row.slug ?? row.id,
    }))
  }

  return NextResponse.json({ suggestions, listings: listingMatches })
}
