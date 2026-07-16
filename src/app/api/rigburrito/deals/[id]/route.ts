import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/rigburrito/auth'
import { appendNote } from '@/lib/rigburrito/strings'
import { createServiceClient } from '@/lib/rigburrito/service'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminApi()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await params
  const service = createServiceClient()
  const { data, error } = await service
    .from('deals')
    .select(`*, listings(title, price, slug), assigned:assigned_to(full_name, id)`)
    .eq('id', id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
  return NextResponse.json({ success: true, deal: data })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminApi()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await params
  const body = await req.json()
  const service = createServiceClient()

  const { data: existing } = await service
    .from('deals')
    .select('status, notes, deal_type')
    .eq('id', id)
    .single()

  const updates: Record<string, unknown> = {}
  const fields = [
    'deal_tier', 'buyer_name', 'buyer_email', 'buyer_phone', 'buyer_message', 'seller_name',
    'asking_price', 'final_sale_price', 'commission_rate', 'commission_earned', 'status', 'assigned_to',
    'enterprise_metadata', 'organization_id',
  ]
  for (const f of fields) {
    if (body[f] !== undefined) updates[f] = body[f]
  }

  if (body.status === 'closed_won' && existing?.deal_type !== 'enterprise') {
    const finalPrice = body.final_sale_price ?? updates.final_sale_price
    const commissionEarned = body.commission_earned ?? updates.commission_earned
    if (finalPrice == null || finalPrice === '' || commissionEarned == null || commissionEarned === '') {
      return NextResponse.json(
        { error: 'Final sale price and commission earned are required to close a deal as won.' },
        { status: 400 },
      )
    }
  }

  if (body.new_note?.trim()) {
    updates.notes = appendNote(existing?.notes ?? null, body.new_note.trim())
  }

  const { error } = await service.from('deals').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminApi()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await params
  const service = createServiceClient()
  const { error } = await service.from('deals').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
