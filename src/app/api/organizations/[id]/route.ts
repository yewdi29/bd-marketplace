import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireOrgProfileEdit } from '@/lib/organizations/auth'

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
  }
  if (body.description !== undefined) {
    updates.description = body.description?.trim() || null
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('organizations')
    .update(updates)
    .eq('id', params.id)
    .select('id, name, logo_url, description, base_seat_count, preferred_payment_method')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, organization: data })
}
