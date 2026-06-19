import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// search_queries log — accumulates real search behavior for future
// popularity-ranked suggestions, not yet used in ranking logic.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as {
    query_text?: string
    results_count?: number | null
    clicked_result_id?: string | null
  } | null

  const queryText = body?.query_text?.trim()
  if (!queryText) return NextResponse.json({ success: true })

  const cookieStore = await cookies()
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await authClient.auth.getUser()

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Best-effort — a logging failure should never surface to the searcher
  await adminClient.from('search_queries').insert({
    query_text: queryText,
    results_count: body?.results_count ?? null,
    clicked_result_id: body?.clicked_result_id ?? null,
    user_id: user?.id ?? null,
  })

  return NextResponse.json({ success: true })
}
