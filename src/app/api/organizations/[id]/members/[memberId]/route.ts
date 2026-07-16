import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { requireOrgMember } from '@/lib/organizations/auth'
import { confirmRemoveSeat } from '@/lib/stripe/enterpriseSubscription'
import {
  managerHasOrgWideManagerAccess,
  parseManagerPermissionsInput,
} from '@/lib/organizations/managerPermissions'
import {
  locationsOverlap,
  managerCanAssignLocations,
  normalizeTeamLocations,
  parseTeamTagInput,
} from '@/lib/organizations/teamLocations'

function getService() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; memberId: string } },
) {
  const auth = await requireOrgMember(params.id)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const body = await req.json() as {
    role?: 'owner' | 'manager'
    team_tag?: string | string[] | null
    permissions?: Partial<{
      can_see_all_locations: boolean
      can_access_billing: boolean
      can_edit_company_info: boolean
      can_manage_managers_org_wide: boolean
    }>
  }

  const supabase = await createClient()
  const { data: target, error: fetchError } = await supabase
    .from('org_members')
    .select(`
      id, role, team_tag, is_primary_owner, status,
      can_see_all_locations, can_access_billing, can_edit_company_info, can_manage_managers_org_wide
    `)
    .eq('id', params.memberId)
    .eq('organization_id', params.id)
    .single()

  if (fetchError || !target) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  }

  if (target.is_primary_owner) {
    return NextResponse.json({ error: 'Cannot edit the primary owner' }, { status: 400 })
  }

  if (body.permissions !== undefined && auth.membership.role !== 'owner') {
    return NextResponse.json({ error: 'Only Owners can edit manager permissions' }, { status: 403 })
  }

  if (body.permissions !== undefined && target.role !== 'manager') {
    return NextResponse.json({ error: 'Permissions apply only to managers' }, { status: 400 })
  }

  if (target.role !== 'manager' && body.team_tag !== undefined) {
    return NextResponse.json({ error: 'Only managers have assigned locations' }, { status: 400 })
  }

  const updates: Record<string, string | string[] | boolean | null> = {}

  if (body.permissions !== undefined && auth.membership.role === 'owner') {
    const perms = parseManagerPermissionsInput(body.permissions)
    updates.can_see_all_locations = perms.can_see_all_locations
    updates.can_access_billing = perms.can_access_billing
    updates.can_edit_company_info = perms.can_edit_company_info
    updates.can_manage_managers_org_wide = perms.can_manage_managers_org_wide
    if (perms.can_see_all_locations) {
      updates.team_tag = null
    } else if (target.can_see_all_locations && body.team_tag === undefined) {
      return NextResponse.json(
        { error: 'Assign at least one location when removing org-wide listing access' },
        { status: 400 },
      )
    }
  }

  const effectiveSeeAll = (updates.can_see_all_locations as boolean | undefined)
    ?? target.can_see_all_locations

  if (auth.membership.role === 'manager') {
    if (target.role === 'owner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (body.role !== undefined || body.permissions !== undefined) {
      return NextResponse.json({ error: 'Managers cannot edit member roles or permissions' }, { status: 403 })
    }
    if (body.team_tag === undefined) {
      if (Object.keys(updates).length === 0) {
        return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
      }
    } else {
      if (effectiveSeeAll) {
        return NextResponse.json({ error: 'Cannot edit locations for managers with all-location access' }, { status: 400 })
      }
      if (!managerHasOrgWideManagerAccess(auth.membership)
        && !locationsOverlap(target.team_tag, auth.membership.team_tag)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const newTags = parseTeamTagInput(body.team_tag)
      if (!newTags) {
        return NextResponse.json({ error: 'At least one location is required for managers' }, { status: 400 })
      }
      if (!managerCanAssignLocations(auth.membership.team_tag, target.team_tag, newTags)) {
        return NextResponse.json(
          { error: 'Managers can only assign locations from their own existing set' },
          { status: 403 },
        )
      }
      updates.team_tag = newTags
    }
  } else {
    if (body.role !== undefined) {
      if (body.role !== 'owner' && body.role !== 'manager') {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
      }
      updates.role = body.role
      if (body.role === 'owner') {
        updates.team_tag = null
        updates.can_see_all_locations = false
        updates.can_access_billing = false
        updates.can_edit_company_info = false
        updates.can_manage_managers_org_wide = false
      }
    }

    if (body.team_tag !== undefined && (body.role ?? target.role) === 'manager') {
      if (effectiveSeeAll) {
        return NextResponse.json(
          { error: 'Disable all-location access before editing assigned locations' },
          { status: 400 },
        )
      }
      const newTags = parseTeamTagInput(body.team_tag)
      if (!newTags) {
        return NextResponse.json({ error: 'At least one location is required for managers' }, { status: 400 })
      }
      updates.team_tag = newTags
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('org_members')
    .update(updates)
    .eq('id', params.memberId)
    .select(`
      id, role, team_tag, status,
      can_see_all_locations, can_access_billing, can_edit_company_info, can_manage_managers_org_wide
    `)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, member: data })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; memberId: string } },
) {
  const auth = await requireOrgMember(params.id)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const supabase = await createClient()
  const { data: target, error: fetchError } = await supabase
    .from('org_members')
    .select('id, role, team_tag, is_primary_owner, status')
    .eq('id', params.memberId)
    .eq('organization_id', params.id)
    .single()

  if (fetchError || !target) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  }

  if (target.is_primary_owner) {
    return NextResponse.json({ error: 'Cannot remove the primary owner' }, { status: 400 })
  }

  if (auth.membership.role === 'manager') {
    if (target.role !== 'manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (!managerHasOrgWideManagerAccess(auth.membership)
      && !locationsOverlap(target.team_tag, auth.membership.team_tag)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const service = getService()

  if (target.status === 'active' || target.status === 'invited') {
    try {
      await confirmRemoveSeat(service, params.id)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Seat billing update failed'
      return NextResponse.json({ error: message }, { status: 400 })
    }
  }

  const { error } = await supabase
    .from('org_members')
    .delete()
    .eq('id', params.memberId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
