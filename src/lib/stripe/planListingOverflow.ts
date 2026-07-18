import type { SupabaseClient } from '@supabase/supabase-js'
import type { MembershipPlan } from '@/lib/types/database'
import { getListingLimitForAccount } from '@/lib/planLimits'
import { hasEnterpriseListingAccess } from '@/lib/organizations/listingLimits'

export interface PlanListingOverflowResult {
  userId: string
  email: string
  newPlan: MembershipPlan
  newPlanLabel: string
  newLimit: number
  keptActiveCount: number
  unpublishedCount: number
}

const PLAN_LABELS: Record<MembershipPlan, string> = {
  free: 'Free',
  starter: 'Starter',
  pro: 'Pro',
  max: 'Max',
  premium: 'Premium',
}

/**
 * When a plan change leaves the user over their active listing cap, unpublish
 * excess listings (status → draft) keeping the newest by created_at (marketplace
 * "Newest" sort). Enterprise org members with billing on file are exempt.
 */
export async function enforceListingOverflowForUser(
  service: SupabaseClient,
  userId: string,
  newPlan: MembershipPlan,
): Promise<PlanListingOverflowResult | null> {
  if (await hasEnterpriseListingAccess(service, userId)) {
    return null
  }

  const limit = getListingLimitForAccount(newPlan, false)
  if (limit === null) {
    return null
  }

  const { data: activeListings, error: listError } = await service
    .from('listings')
    .select('id, created_at')
    .eq('seller_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (listError) {
    throw new Error(`Failed to load active listings: ${listError.message}`)
  }

  const activeCount = activeListings?.length ?? 0
  if (activeCount <= limit) {
    return null
  }

  const toUnpublish = activeListings!.slice(limit)
  const now = new Date().toISOString()

  for (const listing of toUnpublish) {
    const { error: updateError } = await service
      .from('listings')
      .update({ status: 'draft', updated_at: now })
      .eq('id', listing.id)
      .eq('seller_id', userId)
      .eq('status', 'active')

    if (updateError) {
      throw new Error(`Failed to unpublish listing ${listing.id}: ${updateError.message}`)
    }
  }

  const { data: userRow, error: userError } = await service
    .from('users')
    .select('email')
    .eq('id', userId)
    .single()

  if (userError || !userRow?.email) {
    throw new Error(userError?.message ?? 'User email not found for overflow notification')
  }

  return {
    userId,
    email: userRow.email,
    newPlan,
    newPlanLabel: PLAN_LABELS[newPlan] ?? newPlan,
    newLimit: limit,
    keptActiveCount: limit,
    unpublishedCount: toUnpublish.length,
  }
}
