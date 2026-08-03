import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { dispatchOwnershipTransferCompletedEmail } from '@/lib/email/orgEmails'

function getService() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function POST(req: NextRequest) {
  const body = await req.json() as { token?: string }
  if (!body.token) {
    return NextResponse.json({ error: 'token is required' }, { status: 400 })
  }

  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = getService()

  const { data: transfer, error } = await service
    .from('org_ownership_transfers')
    .select('id, organization_id, to_member_id, status, expires_at')
    .eq('transfer_token', body.token)
    .eq('status', 'pending')
    .maybeSingle()

  if (error || !transfer) {
    return NextResponse.json({ error: 'Transfer request not found' }, { status: 404 })
  }

  if (new Date(transfer.expires_at) < new Date()) {
    await service
      .from('org_ownership_transfers')
      .update({ status: 'expired' })
      .eq('id', transfer.id)
    return NextResponse.json({ error: 'Transfer request has expired' }, { status: 400 })
  }

  const { data: recipientMember } = await service
    .from('org_members')
    .select('user_id')
    .eq('id', transfer.to_member_id)
    .single()

  if (!recipientMember || recipientMember.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: currentPrimary } = await service
    .from('org_members')
    .select('id')
    .eq('organization_id', transfer.organization_id)
    .eq('is_primary_owner', true)
    .eq('status', 'active')
    .maybeSingle()

  if (currentPrimary) {
    await service
      .from('org_members')
      .update({ is_primary_owner: false })
      .eq('id', currentPrimary.id)
  }

  await service
    .from('org_members')
    .update({ is_primary_owner: true, role: 'owner', team_tag: null })
    .eq('id', transfer.to_member_id)

  await service
    .from('org_ownership_transfers')
    .update({ status: 'accepted' })
    .eq('id', transfer.id)

  if (user.email) {
    const { data: org } = await service
      .from('organizations')
      .select('name')
      .eq('id', transfer.organization_id)
      .maybeSingle()

    dispatchOwnershipTransferCompletedEmail({
      recipientEmail: user.email,
      transferId: transfer.id,
      organizationName: org?.name ?? 'your organization',
    })
  }

  return NextResponse.json({
    success: true,
    organizationId: transfer.organization_id,
  })
}

