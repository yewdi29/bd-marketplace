import { createElement } from 'react'
import type { MembershipPlan } from '@/lib/types/database'
import { PLAN_LISTING_LIMITS } from '@/lib/planLimits'
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

/** Next paid tier to pitch when the user is capped on their current plan. */
const NEXT_TIER: Partial<Record<MembershipPlan, MembershipPlan>> = {
  free: 'starter',
  starter: 'pro',
  pro: 'max',
}

export function getListingLimitUpsellCopy(plan: MembershipPlan): {
  currentPlanLabel: string
  currentLimit: number
  nextPlanLabel: string
  nextListingAllowance: string
} | null {
  const next = NEXT_TIER[plan]
  const currentLimit = PLAN_LISTING_LIMITS[plan]
  if (!next || !Number.isFinite(currentLimit)) return null

  const nextLimit = PLAN_LISTING_LIMITS[next]
  const nextListingAllowance =
    nextLimit === Infinity
      ? 'unlimited active listings'
      : `${nextLimit} active listings`

  return {
    currentPlanLabel: PLAN_LABELS[plan] ?? plan,
    currentLimit,
    nextPlanLabel: PLAN_LABELS[next] ?? next,
    nextListingAllowance,
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
