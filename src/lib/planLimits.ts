import type { MembershipPlan } from '@/lib/types/database'

export const PLAN_LISTING_LIMITS: Record<MembershipPlan, number> = {
  free: 3,
  starter: 15,
  pro: 40,
  max: Infinity,
  premium: Infinity,
}

export function isUnlimitedPlan(plan: MembershipPlan): boolean {
  return PLAN_LISTING_LIMITS[plan] === Infinity
}

export function getListingLimit(plan: MembershipPlan): number | null {
  const limit = PLAN_LISTING_LIMITS[plan]
  return limit === Infinity ? null : limit
}

/** Active listings only — matches dashboard profile meter. Max shows count alone. */
export function formatActiveListingDisplay(plan: MembershipPlan, activeCount: number): string {
  const limit = getListingLimit(plan)
  if (limit === null) return String(activeCount)
  return `${activeCount} / ${limit}`
}
