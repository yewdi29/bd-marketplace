import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { requireOrgMember } from '@/lib/organizations/auth'
import { dispatchOrgInviteEmail } from '@/lib/email/orgEmails'
import {
  confirmAddSeat,
  previewAddSeat,
} from '@/lib/stripe/enterpriseSubscription'
import { resolveSeatChangeActorName } from '@/lib/email/seatBillingReceipt'
import {
  DEFAULT_MANAGER_PERMISSIONS,
  managerHasOrgWideManagerAccess,
  parseManagerPermissionsInput,
} from '@/lib/organizations/managerPermissions'
import {
  isLocationSubset,
  normalizeTeamLocations,
  parseTeamTagInput,
} from '@/lib/organizations/teamLocations'

function getService() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

const INVITE_TTL_DAYS = 7

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireOrgMember(params.id)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const body = await req.json() as {
    email?: string
    role?: 'owner' | 'manager'
    team_tag?: string | string[] | null
    permissions?: Partial<{
      can_see_all_locations: boolean
      can_access_billing: boolean
      can_edit_company_info: boolean
      can_manage_managers_org_wide: boolean
    }>
    mode?: 'preview' | 'confirm'
    invite_token?: string
  }

  const mode = body.mode ?? 'preview'
  const email = body.email?.trim().toLowerCase()

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  const membership = auth.membership
  let role = body.role
  let teamTag = parseTeamTagInput(body.team_tag)
  let permissions = { ...DEFAULT_MANAGER_PERMISSIONS }

  if (membership.role === 'manager') {
    role = 'manager'
    permissions = { ...DEFAULT_MANAGER_PERMISSIONS }

    if (managerHasOrgWideManagerAccess(membership)) {
      teamTag = parseTeamTagInput(body.team_tag)
      if (!teamTag) {
        return NextResponse.json({ error: 'At least one location is required for managers' }, { status: 400 })
      }
    } else {
      teamTag = normalizeTeamLocations(membership.team_tag)
      if (teamTag.length === 0) {
        return NextResponse.json({ error: 'Your account has no assigned locations' }, { status: 400 })
      }
    }
  } else if (!role || (role !== 'owner' && role !== 'manager')) {
    return NextResponse.json({ error: 'Role must be owner or manager' }, { status: 400 })
  } else if (role === 'manager') {
    permissions = parseManagerPermissionsInput(body.permissions)
    if (permissions.can_see_all_locations) {
      teamTag = null
    } else {
      teamTag = parseTeamTagInput(body.team_tag)
      if (!teamTag) {
        return NextResponse.json({ error: 'At least one location is required for managers' }, { status: 400 })
      }
    }
  }

  if (role === 'owner') {
    teamTag = null
    permissions = { ...DEFAULT_MANAGER_PERMISSIONS }
  }

  if (
    membership.role === 'manager'
    && role === 'manager'
    && teamTag
    && !managerHasOrgWideManagerAccess(membership)
    && !isLocationSubset(teamTag, membership.team_tag)
  ) {
    return NextResponse.json(
      { error: 'Managers can only invite into their own assigned locations' },
      { status: 403 },
    )
  }

  const service = getService()

  if (mode === 'preview') {
    try {
      const preview = await previewAddSeat(service, params.id)
      return NextResponse.json({ success: true, preview })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Billing preview failed'
      return NextResponse.json({ error: message }, { status: 400 })
    }
  }

  if (mode !== 'confirm') {
    return NextResponse.json({ error: 'mode must be preview or confirm' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('org_members')
    .select('id')
    .eq('organization_id', params.id)
    .eq('invited_email', email)
    .in('status', ['invited', 'active'])
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'This email already has a pending or active membership' }, { status: 400 })
  }

  try {
    const actorName = await resolveSeatChangeActorName(service, auth.userId)
    await confirmAddSeat(service, params.id, {
      userId: auth.userId,
      name: actorName,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Seat billing failed'
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const inviteToken = randomUUID()
  const inviteExpiresAt = new Date()
  inviteExpiresAt.setDate(inviteExpiresAt.getDate() + INVITE_TTL_DAYS)

  const { data: memberRow, error: insertError } = await service
    .from('org_members')
    .insert({
      organization_id: params.id,
      role,
      team_tag: teamTag,
      status: 'invited',
      invited_email: email,
      invite_token: inviteToken,
      invite_expires_at: inviteExpiresAt.toISOString(),
      can_see_all_locations: role === 'manager' ? permissions.can_see_all_locations : false,
      can_access_billing: role === 'manager' ? permissions.can_access_billing : false,
      can_edit_company_info: role === 'manager' ? permissions.can_edit_company_info : false,
      can_manage_managers_org_wide: role === 'manager' ? permissions.can_manage_managers_org_wide : false,
    })
    .select('id')
    .single()

  if (insertError || !memberRow) {
    return NextResponse.json(
      { error: insertError?.message ?? 'Failed to create invite' },
      { status: 500 },
    )
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', params.id)
    .single()

  const { data: inviterProfile } = await supabase
    .from('users')
    .select('full_name, email')
    .eq('id', auth.userId)
    .single()

  dispatchOrgInviteEmail({
    recipientEmail: email,
    memberId: memberRow.id,
    organizationName: org?.name ?? 'your organization',
    role,
    teamTag,
    inviteToken,
    inviterName: inviterProfile?.full_name ?? inviterProfile?.email ?? 'A team member',
  })

  return NextResponse.json({
    success: true,
    memberId: memberRow.id,
    invite_token: inviteToken,
    invite_expires_at: inviteExpiresAt.toISOString(),
  })
}
