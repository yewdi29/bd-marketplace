import type { SupabaseClient } from '@supabase/supabase-js'
import type { MembershipPlan } from '@/lib/types/database'
import { hasActiveOrgMembership } from '@/lib/organizations/listingLimits'
import type { BuyerTrustSnapshot, InquiryTrustLabel } from '@/lib/inquiryVerification/types'

const PAID_PLANS = new Set<MembershipPlan>(['starter', 'pro', 'max', 'premium'])

export function resolveTrustLabel(
  plan: MembershipPlan,
  isEnterpriseMember: boolean,
): InquiryTrustLabel {
  if (isEnterpriseMember || PAID_PLANS.has(plan)) {
    return 'verified_member'
  }
  return 'unverified_free'
}

export function formatBuyerTierSnapshot(
  plan: MembershipPlan,
  isEnterpriseMember: boolean,
): string {
  if (isEnterpriseMember) return 'enterprise'
  return plan
}

export async function getBuyerTrustSnapshot(
  client: SupabaseClient,
  buyerUserId: string,
): Promise<BuyerTrustSnapshot> {
  const [{ data: profile }, isEnterpriseMember] = await Promise.all([
    client.from('users').select('plan').eq('id', buyerUserId).single(),
    hasActiveOrgMembership(client, buyerUserId),
  ])

  const plan = (profile?.plan ?? 'free') as MembershipPlan

  return {
    buyer_tier_at_submission: formatBuyerTierSnapshot(plan, isEnterpriseMember),
    trust_label: resolveTrustLabel(plan, isEnterpriseMember),
  }
}
