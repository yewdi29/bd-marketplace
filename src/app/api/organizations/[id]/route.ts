import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { requireOrgProfileEdit } from '@/lib/organizations/auth'
import { generateUniqueOrganizationSlug } from '@/lib/sellers/companySlug'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireOrgProfileEdit(params.id)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const body = await req.json() as {
    name?: string
    description?: string | null
  }

  const updates: Record<string, string | null> = {}
  if (body.name !== undefined) {
    const name = body.name.trim()
    if (!name) {
      return NextResponse.json({ error: 'Organization name is required' }, { status: 400 })
    }
    updates.name = name
    updates.slug = await generateUniqueOrganizationSlug(getServiceClient(), name, params.id)
  }
  if (body.description !== undefined) {
    updates.description = body.description?.trim() || null
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
  }

  updates.updated_at = new Date().toISOString()

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('organizations')
    .update(updates)
    .eq('id', params.id)
    .select('id, name, slug, logo_url, description, base_seat_count, preferred_payment_method')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, organization: data })
}
