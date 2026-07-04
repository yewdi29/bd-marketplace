import Stripe from 'stripe'
import type { MembershipPlan } from '@/lib/types/database'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-05-27.dahlia',
})

export function tierFromPriceId(priceId: string): MembershipPlan {
  const map: Record<string, MembershipPlan> = {
    [process.env.STRIPE_STARTER_MONTHLY_PRICE_ID ?? '']: 'starter',
    [process.env.STRIPE_STARTER_ANNUAL_PRICE_ID ?? '']: 'starter',
    [process.env.STRIPE_PRO_MONTHLY_PRICE_ID ?? '']: 'pro',
    [process.env.STRIPE_PRO_ANNUAL_PRICE_ID ?? '']: 'pro',
    [process.env.STRIPE_MAX_MONTHLY_PRICE_ID ?? '']: 'max',
    [process.env.STRIPE_MAX_ANNUAL_PRICE_ID ?? '']: 'max',
  }
  return map[priceId] ?? 'free'
}

export function planMonthlyAmount(plan: MembershipPlan): number {
  switch (plan) {
    case 'starter': return 49
    case 'pro': return 99
    case 'max': return 199
    default: return 0
  }
}

export async function calculateMRR(): Promise<number> {
  const subs = await stripe.subscriptions.list({ status: 'active', limit: 100 })
  let mrr = 0
  for (const sub of subs.data) {
    const item = sub.items.data[0]
    if (!item?.price) continue
    const amount = item.price.unit_amount ?? 0
    const interval = item.price.recurring?.interval
    if (interval === 'year') {
      mrr += amount / 12
    } else {
      mrr += amount
    }
  }
  return mrr / 100
}
