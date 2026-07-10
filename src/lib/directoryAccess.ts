import { cache } from 'react'
import { getAuthUser } from '@/lib/supabase/auth-server'
import { createClient } from '@/lib/supabase/server'
import type { MembershipPlan } from '@/lib/types/database'

/** Minimum paid plan required to view the business directory. Raise to 'pro' or 'max' here only. */
export const MINIMUM_TIER_FOR_DIRECTORY = 'starter' as const satisfies MembershipPlan

const PLAN_RANK: Record<MembershipPlan, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  max: 3,
  premium: 2, // legacy paid tier — equivalent to pro
}

export function hasDirectoryAccess(plan: MembershipPlan | null | undefined): boolean {
  if (!plan) return false
  const minRank = PLAN_RANK[MINIMUM_TIER_FOR_DIRECTORY]
  return (PLAN_RANK[plan] ?? 0) >= minRank
}

export const getDirectoryAccess = cache(async () => {
  const user = await getAuthUser()
  if (!user) {
    return { allowed: false, signedIn: false, plan: null as MembershipPlan | null }
  }

  const supabase = await createClient()
  const { data } = await supabase
    .from('users')
    .select('plan')
    .eq('id', user.id)
    .single()

  const plan = (data?.plan as MembershipPlan | undefined) ?? 'free'
  return { allowed: hasDirectoryAccess(plan), signedIn: true, plan }
})
