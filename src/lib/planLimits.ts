import type { MembershipPlan } from '@/lib/types/database'

export const PLAN_LISTING_LIMITS: Record<MembershipPlan, number> = {
  free: 3,
  starter: 15,
  pro: 40,
  max: Infinity,
  premium: Infinity,
}

/** Enterprise org members use Max's unlimited cap — same sentinel, not separate logic. */
export const ENTERPRISE_LISTING_LIMIT = PLAN_LISTING_LIMITS.max

/** Plan used for limit lookups; enterprise members are treated as Max. */
export function effectiveListingPlan(
  plan: MembershipPlan,
  isEnterpriseMember = false,
): MembershipPlan {
  return isEnterpriseMember ? 'max' : plan
}

export function isUnlimitedPlan(plan: MembershipPlan): boolean {
  return PLAN_LISTING_LIMITS[plan] === Infinity
}

export function getListingLimit(plan: MembershipPlan): number | null {
  const limit = PLAN_LISTING_LIMITS[plan]
  return limit === Infinity ? null : limit
}

export function getAccountListingLimit(
  plan: MembershipPlan,
  isEnterpriseMember = false,
): number {
  return PLAN_LISTING_LIMITS[effectiveListingPlan(plan, isEnterpriseMember)]
}

export function hasUnlimitedListings(
  plan: MembershipPlan,
  isEnterpriseMember = false,
): boolean {
  return isUnlimitedPlan(effectiveListingPlan(plan, isEnterpriseMember))
}

export function getListingLimitForAccount(
  plan: MembershipPlan,
  isEnterpriseMember = false,
): number | null {
  return getListingLimit(effectiveListingPlan(plan, isEnterpriseMember))
}

/** Active listings only — matches dashboard profile meter. Max shows count alone. */
export function formatActiveListingDisplay(plan: MembershipPlan, activeCount: number): string {
  const limit = getListingLimit(plan)
  if (limit === null) return String(activeCount)
  return `${activeCount} / ${limit}`
}

export function formatActiveListingDisplayForAccount(
  plan: MembershipPlan,
  activeCount: number,
  isEnterpriseMember = false,
): string {
  return formatActiveListingDisplay(effectiveListingPlan(plan, isEnterpriseMember), activeCount)
}
