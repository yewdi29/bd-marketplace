import type { SupabaseClient } from '@supabase/supabase-js'
import type { MembershipPlan } from '@/lib/types/database'
import {
  getAccountListingLimit,
  hasUnlimitedListings,
} from '@/lib/planLimits'
import { getOrgBillingGateState } from '@/lib/organizations/billingGate'

export async function hasActiveOrgMembership(
  client: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data } = await client
    .from('org_members')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  return Boolean(data)
}

/** Enterprise listing benefits — active org member with billing on file. */
export async function hasEnterpriseListingAccess(
  client: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const gate = await getOrgBillingGateState(client, userId)
  return gate.isActiveOrgMember && gate.billingComplete
}

export async function getAccountListingLimitState(
  client: SupabaseClient,
  userId: string,
): Promise<{
  plan: MembershipPlan
  isEnterpriseMember: boolean
  limit: number
  unlimited: boolean
}> {
  const [{ data: profile }, isEnterpriseMember] = await Promise.all([
    client.from('users').select('plan').eq('id', userId).single(),
    hasEnterpriseListingAccess(client, userId),
  ])

  const plan = (profile?.plan ?? 'free') as MembershipPlan

  return {
    plan,
    isEnterpriseMember,
    limit: getAccountListingLimit(plan, isEnterpriseMember),
    unlimited: hasUnlimitedListings(plan, isEnterpriseMember),
  }
}

export async function isAtActiveListingLimit(
  client: SupabaseClient,
  userId: string,
): Promise<{
  atLimit: boolean
  limit: number
  plan: MembershipPlan
  isEnterpriseMember: boolean
}> {
  const state = await getAccountListingLimitState(client, userId)

  if (state.unlimited) {
    return {
      atLimit: false,
      limit: state.limit,
      plan: state.plan,
      isEnterpriseMember: state.isEnterpriseMember,
    }
  }

  const { count } = await client
    .from('listings')
    .select('id', { count: 'exact', head: true })
    .eq('seller_id', userId)
    .eq('status', 'active')

  return {
    atLimit: (count ?? 0) >= state.limit,
    limit: state.limit,
    plan: state.plan,
    isEnterpriseMember: state.isEnterpriseMember,
  }
}
