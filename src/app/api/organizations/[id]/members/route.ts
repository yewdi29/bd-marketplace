import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireOrgMember } from '@/lib/organizations/auth'
import { managerHasOrgWideManagerAccess } from '@/lib/organizations/managerPermissions'
import { locationsOverlap } from '@/lib/organizations/teamLocations'

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireOrgMember(params.id)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('org_members')
    .select(`
      id,
      user_id,
      role,
      team_tag,
      is_primary_owner,
      status,
      invited_email,
      invite_expires_at,
      joined_at,
      created_at,
      can_see_all_locations,
      can_access_billing,
      can_edit_company_info,
      can_manage_managers_org_wide,
      users(full_name, email)
    `)
    .eq('organization_id', params.id)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const members = (data ?? [])
    .map(row => {
      const user = row.users as unknown as { full_name: string | null; email: string } | null
      return {
        id: row.id,
        user_id: row.user_id,
        role: row.role,
        team_tag: row.team_tag,
        is_primary_owner: row.is_primary_owner,
        status: row.status,
        invited_email: row.invited_email,
        invite_expires_at: row.invite_expires_at,
        joined_at: row.joined_at,
        created_at: row.created_at,
        can_see_all_locations: row.can_see_all_locations,
        can_access_billing: row.can_access_billing,
        can_edit_company_info: row.can_edit_company_info,
        can_manage_managers_org_wide: row.can_manage_managers_org_wide,
        full_name: user?.full_name ?? null,
        email: user?.email ?? row.invited_email,
      }
    })
    .filter(row => {
      if (auth.membership.role === 'owner') return true
      if (row.role === 'owner') return false
      if (managerHasOrgWideManagerAccess(auth.membership)) return true
      return locationsOverlap(row.team_tag, auth.membership.team_tag)
    })

  return NextResponse.json({ success: true, members })
}
