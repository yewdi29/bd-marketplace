import { createClient } from '@/lib/supabase/server'
import type { OrgMemberRole, OrgMemberStatus } from '@/lib/types/database'
import {
  getOrgBillingGateState,
  type OrgBillingGateState,
} from '@/lib/organizations/billingGate'
import {
  managerHasBillingAccess,
  managerHasProfileEditAccess,
} from '@/lib/organizations/managerPermissions'

const MEMBERSHIP_SELECT = `
  id, organization_id, user_id, role, team_tag, is_primary_owner, status, invited_email,
  can_see_all_locations, can_access_billing, can_edit_company_info, can_manage_managers_org_wide
`

export interface OrgMembership {
  id: string
  organization_id: string
  user_id: string | null
  role: OrgMemberRole
  team_tag: string[] | null
  is_primary_owner: boolean
  status: OrgMemberStatus
  invited_email: string | null
  can_see_all_locations: boolean
  can_access_billing: boolean
  can_edit_company_info: boolean
  can_manage_managers_org_wide: boolean
}

export async function getActiveOrgMembership(
  userId: string,
): Promise<OrgMembership | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('org_members')
    .select(MEMBERSHIP_SELECT)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  return data as OrgMembership | null
}

export async function requireOrgMember(
  organizationId: string,
): Promise<
  | { ok: true; userId: string; membership: OrgMembership }
  | { ok: false; error: string; status: number }
> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, error: 'Unauthorized', status: 401 }
  }

  const { data: membership } = await supabase
    .from('org_members')
    .select(MEMBERSHIP_SELECT)
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (!membership) {
    return { ok: false, error: 'Forbidden', status: 403 }
  }

  return { ok: true, userId: user.id, membership: membership as OrgMembership }
}

export async function requireOrgOwner(
  organizationId: string,
): Promise<
  | { ok: true; userId: string; membership: OrgMembership }
  | { ok: false; error: string; status: number }
> {
  const auth = await requireOrgMember(organizationId)
  if (!auth.ok) return auth
  if (auth.membership.role !== 'owner') {
    return { ok: false, error: 'Forbidden — org owner access required', status: 403 }
  }
  return auth
}

/** Billing tab/API — Owners or Managers with can_access_billing. */
export async function requireOrgBillingAccess(
  organizationId: string,
): Promise<
  | { ok: true; userId: string; membership: OrgMembership }
  | { ok: false; error: string; status: number }
> {
  const auth = await requireOrgMember(organizationId)
  if (!auth.ok) return auth
  if (!managerHasBillingAccess(auth.membership)) {
    return { ok: false, error: 'Forbidden — billing access required', status: 403 }
  }
  return auth
}

/** Company profile edit — Owners or Managers with can_edit_company_info. */
export async function requireOrgProfileEdit(
  organizationId: string,
): Promise<
  | { ok: true; userId: string; membership: OrgMembership }
  | { ok: false; error: string; status: number }
> {
  const auth = await requireOrgMember(organizationId)
  if (!auth.ok) return auth
  if (!managerHasProfileEditAccess(auth.membership)) {
    return { ok: false, error: 'Forbidden — company profile edit access required', status: 403 }
  }
  return auth
}

/** Hard floor: primary ownership transfer — role=owner only, never Managers. */
export async function requirePrimaryOrgOwner(
  organizationId: string,
): Promise<
  | { ok: true; userId: string; membership: OrgMembership }
  | { ok: false; error: string; status: number }
> {
  const auth = await requireOrgMember(organizationId)
  if (!auth.ok) return auth
  if (auth.membership.role !== 'owner') {
    return { ok: false, error: 'Forbidden — only Owners can initiate ownership transfer', status: 403 }
  }
  if (!auth.membership.is_primary_owner) {
    return { ok: false, error: 'Forbidden — primary owner access required', status: 403 }
  }
  return auth
}

/** Blocks dashboard/product APIs until org billing setup is complete. */
export async function requireDashboardAccess(): Promise<
  | { ok: true; userId: string; billingGate: OrgBillingGateState }
  | { ok: false; error: string; status: number; billingRequired?: boolean }
> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, error: 'Unauthorized', status: 401 }
  }

  const billingGate = await getOrgBillingGateState(supabase, user.id)
  if (billingGate.requiresBillingSetup) {
    return {
      ok: false,
      error: 'Complete organization billing setup to access the dashboard',
      status: 403,
      billingRequired: true,
    }
  }

  return { ok: true, userId: user.id, billingGate }
}
