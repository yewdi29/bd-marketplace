import type { SupabaseClient } from '@supabase/supabase-js'

export interface OrgBillingGateState {
  isActiveOrgMember: boolean
  billingComplete: boolean
  /** Active org member whose organization has no payment method on file. */
  requiresBillingSetup: boolean
  organizationId: string | null
  isPrimaryOwner: boolean
}

const NO_GATE: OrgBillingGateState = {
  isActiveOrgMember: false,
  billingComplete: true,
  requiresBillingSetup: false,
  organizationId: null,
  isPrimaryOwner: false,
}

export async function getOrgBillingGateState(
  client: SupabaseClient,
  userId: string,
): Promise<OrgBillingGateState> {
  const { data, error } = await client
    .from('org_members')
    .select(`
      organization_id,
      is_primary_owner,
      organizations!inner(preferred_payment_method)
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  if (error || !data) {
    return NO_GATE
  }

  const org = data.organizations as unknown as { preferred_payment_method: string | null } | null
  const billingComplete = Boolean(org?.preferred_payment_method)

  return {
    isActiveOrgMember: true,
    billingComplete,
    requiresBillingSetup: !billingComplete,
    organizationId: data.organization_id,
    isPrimaryOwner: data.is_primary_owner,
  }
}

/** Dashboard redirect target while billing setup is pending. */
export function orgBillingSetupPath(_isPrimaryOwner?: boolean): string {
  return '/dashboard/organization?tab=billing'
}

export const ORG_BILLING_SETUP_ALLOWED_PATH = '/dashboard/organization'
