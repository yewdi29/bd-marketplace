import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { requirePrimaryOrgOwner } from '@/lib/organizations/auth'
import { dispatchOwnershipTransferRequestEmail } from '@/lib/email/orgEmails'

const TRANSFER_TTL_DAYS = 7

function getService() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requirePrimaryOrgOwner(params.id)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const body = await req.json() as { toMemberId?: string }
  if (!body.toMemberId) {
    return NextResponse.json({ error: 'toMemberId is required' }, { status: 400 })
  }

  const supabase = getService()

  const { data: recipient, error: recipientError } = await supabase
    .from('org_members')
    .select('id, user_id, role, status, users(email, full_name)')
    .eq('id', body.toMemberId)
    .eq('organization_id', params.id)
    .single()

  if (recipientError || !recipient) {
    return NextResponse.json({ error: 'Recipient not found' }, { status: 404 })
  }

  if (recipient.status !== 'active' || !recipient.user_id) {
    return NextResponse.json({ error: 'Recipient must be an active member' }, { status: 400 })
  }

  if (recipient.user_id === auth.userId) {
    return NextResponse.json({ error: 'Cannot transfer to yourself' }, { status: 400 })
  }

  await supabase
    .from('org_ownership_transfers')
    .update({ status: 'cancelled' })
    .eq('organization_id', params.id)
    .eq('status', 'pending')

  const transferToken = randomUUID()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + TRANSFER_TTL_DAYS)

  const { data: transfer, error: transferError } = await supabase
    .from('org_ownership_transfers')
    .insert({
      organization_id: params.id,
      from_user_id: auth.userId,
      to_member_id: recipient.id,
      transfer_token: transferToken,
      expires_at: expiresAt.toISOString(),
    })
    .select('id')
    .single()

  if (transferError || !transfer) {
    return NextResponse.json({ error: transferError?.message ?? 'Failed to create transfer' }, { status: 500 })
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', params.id)
    .single()

  const { data: currentOwner } = await supabase
    .from('users')
    .select('full_name, email')
    .eq('id', auth.userId)
    .single()

  const recipientUser = recipient.users as unknown as { email: string; full_name: string | null }

  dispatchOwnershipTransferRequestEmail({
    recipientEmail: recipientUser.email,
    transferId: transfer.id,
    organizationName: org?.name ?? 'your organization',
    currentOwnerName: currentOwner?.full_name ?? currentOwner?.email ?? 'The current primary owner',
    transferToken,
  })

  return NextResponse.json({ success: true, transferId: transfer.id })
}
