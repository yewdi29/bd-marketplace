import { createElement } from 'react'
import type { MembershipPlan } from '@/lib/types/database'
import { PLAN_LISTING_LIMITS } from '@/lib/planLimits'
import { PAID_MEMBERSHIP_TIERS } from '@/lib/pricing/membershipTiers'
import ListingLimitUpsell from '../../../emails/templates/ListingLimitUpsell'
import { getEmailAppUrl } from './resendClient'
import { sendTransactionalEmail } from './sendTransactionalEmail'

const PLAN_LABELS: Record<MembershipPlan, string> = {
  free: 'Free',
  starter: 'Starter',
  pro: 'Pro',
  max: 'Max',
  premium: 'Premium',
}

/**
 * Next tier to pitch when the user hits their active-listing cap.
 * Matches pricing/upgrade ladder: Free(3) → Starter(15) → Pro(40) → Max(Unlimited).
 */
const NEXT_TIER: Partial<Record<MembershipPlan, MembershipPlan>> = {
  free: 'starter',
  starter: 'pro',
  pro: 'max',
}

function listingAllowanceLabel(plan: MembershipPlan): string {
  if (plan === 'free') return `${PLAN_LISTING_LIMITS.free} active listings`
  const paid = PAID_MEMBERSHIP_TIERS.find(t => t.id === plan)
  if (paid) {
    // Prefer pricing-page listingLabel wording, expanded for sentence use
    if (paid.listingLabel.toLowerCase() === 'unlimited') return 'unlimited active listings'
    const n = PLAN_LISTING_LIMITS[plan]
    if (Number.isFinite(n)) return `${n} active listings`
    return paid.listingLabel
  }
  const n = PLAN_LISTING_LIMITS[plan]
  return n === Infinity ? 'unlimited active listings' : `${n} active listings`
}

export function getListingLimitUpsellCopy(plan: MembershipPlan): {
  currentPlanLabel: string
  currentLimit: number
  nextPlanLabel: string
  nextListingAllowance: string
} | null {
  const next = NEXT_TIER[plan]
  const currentLimit = PLAN_LISTING_LIMITS[plan]
  // Free (3), Starter (15), Pro (40) can upsell; Max/Premium are unlimited — skip
  if (!next || !Number.isFinite(currentLimit)) return null

  return {
    currentPlanLabel: PLAN_LABELS[plan] ?? plan,
    currentLimit,
    nextPlanLabel: PLAN_LABELS[next] ?? next,
    nextListingAllowance: listingAllowanceLabel(next),
  }
}

export async function sendListingLimitUpsellEmail(opts: {
  userId: string
  recipientEmail: string
  firstName?: string | null
  plan: MembershipPlan
}): Promise<{ sent: boolean; skipped: boolean }> {
  const copy = getListingLimitUpsellCopy(opts.plan)
  if (!copy) {
    return { sent: false, skipped: true }
  }

  const base = getEmailAppUrl()
  const result = await sendTransactionalEmail({
    templateType: 'ListingLimitUpsell',
    recipientEmail: opts.recipientEmail,
    relatedEntityType: 'user',
    relatedEntityId: opts.userId,
    subject: `You've reached your ${copy.currentPlanLabel} listing limit`,
    react: createElement(ListingLimitUpsell, {
      firstName: opts.firstName ?? null,
      currentPlanLabel: copy.currentPlanLabel,
      currentLimit: copy.currentLimit,
      nextPlanLabel: copy.nextPlanLabel,
      nextListingAllowance: copy.nextListingAllowance,
      upgradeUrl: `${base}/dashboard/upgrade`,
    }),
  })

  return { sent: result.sent, skipped: false }
}
