import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

function makeClients(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  return { authClient, adminClient }
}

// Convert a company name to a URL-safe slug
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

// Generate a unique company slug — appends a random 4-char suffix if taken
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function generateUniqueSlug(
  adminClient: any,
  companyName: string,
  currentUserId: string
): Promise<string> {
  const base = slugify(companyName)
  if (!base) return ''

  const { data: existing } = await adminClient
    .from('users')
    .select('id')
    .eq('company_slug', base)
    .neq('id', currentUserId)
    .maybeSingle()

  if (!existing) return base

  // Collision — append a short random suffix
  const suffix = Math.random().toString(36).slice(2, 6)
  return `${base}-${suffix}`
}

// ─── GET /api/users/me ────────────────────────────────────────────────────────

export async function GET(_request: NextRequest) {
  const cookieStore = await cookies()
  const { authClient, adminClient } = makeClients(cookieStore)

  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await adminClient
    .from('users')
    .select('full_name, company_name, company_slug, company_logo_url, phone, city, state, country')
    .eq('id', user.id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  return NextResponse.json({ user: { ...data, email: user.email } })
}

// ─── PATCH /api/users/me ──────────────────────────────────────────────────────

const ALLOWED_FIELDS = ['full_name', 'company_name', 'phone', 'city', 'state', 'country'] as const

export async function PATCH(request: NextRequest) {
  const cookieStore = await cookies()
  const { authClient, adminClient } = makeClients(cookieStore)

  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await request.json() as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const field of ALLOWED_FIELDS) {
    if (field in body) updates[field] = body[field] ?? null
  }

  // Auto-generate company_slug whenever company_name is updated
  if ('company_name' in body && typeof body.company_name === 'string' && body.company_name.trim()) {
    updates.company_slug = await generateUniqueSlug(adminClient, body.company_name.trim(), user.id)
  } else if ('company_name' in body && !body.company_name) {
    // Company name cleared — also clear the slug
    updates.company_slug = null
  }

  const { error } = await adminClient
    .from('users')
    .update(updates)
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
