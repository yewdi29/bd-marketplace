import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { activateOrgMemberOnJoin } from '@/lib/organizations/activateOrgMembership'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.json({ error: 'token is required' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: member, error } = await supabase
    .from('org_members')
    .select(`
      id,
      role,
      team_tag,
      is_primary_owner,
      status,
      invited_email,
      invite_expires_at,
      organizations(name)
    `)
    .eq('invite_token', token)
    .maybeSingle()

  if (error || !member) {
    return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
  }

  if (member.status !== 'invited') {
    return NextResponse.json({ error: 'This invite is no longer valid' }, { status: 400 })
  }

  if (member.invite_expires_at && new Date(member.invite_expires_at) < new Date()) {
    return NextResponse.json({ error: 'This invite has expired', expired: true }, { status: 410 })
  }

  const org = member.organizations as unknown as { name: string } | null

  return NextResponse.json({
    success: true,
    invite: {
      organizationName: org?.name ?? 'Organization',
      role: member.role,
      teamTag: member.team_tag,
      invitedEmail: member.invited_email,
      expiresAt: member.invite_expires_at,
      isPrimaryOwner: member.is_primary_owner,
    },
  })
}

export async function POST(req: NextRequest) {
  const body = await req.json() as { token?: string }
  if (!body.token) {
    return NextResponse.json({ error: 'token is required' }, { status: 400 })
  }

  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized', requiresAuth: true }, { status: 401 })
  }

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: member, error } = await service
    .from('org_members')
    .select('id, organization_id, status, invited_email, invite_expires_at, is_primary_owner')
    .eq('invite_token', body.token)
    .maybeSingle()

  if (error || !member) {
    return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
  }

  if (member.status !== 'invited') {
    return NextResponse.json({ error: 'This invite is no longer valid' }, { status: 400 })
  }

  if (member.invite_expires_at && new Date(member.invite_expires_at) < new Date()) {
    return NextResponse.json({ error: 'This invite has expired', expired: true }, { status: 410 })
  }

  const userEmail = user.email?.toLowerCase()
  if (!userEmail || userEmail !== member.invited_email?.toLowerCase()) {
    return NextResponse.json(
      { error: 'Sign in with the email address that received this invite' },
      { status: 403 },
    )
  }

  try {
    await activateOrgMemberOnJoin(service, {
      memberId: member.id,
      userId: user.id,
      organizationId: member.organization_id,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to activate membership'
    return NextResponse.json({ error: message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    organizationId: member.organization_id,
    isPrimaryOwner: member.is_primary_owner,
  })
}
