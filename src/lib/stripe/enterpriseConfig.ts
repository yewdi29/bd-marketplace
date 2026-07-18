/** Enterprise Stripe price IDs — set via env after running scripts/setup-enterprise-stripe.mjs */

import {
  paymentMethodTypesForTier,
  type CheckoutBillingInterval,
} from '@/lib/stripe/paymentMethodTypes'

export type EnterpriseBillingInterval = CheckoutBillingInterval

const ENTERPRISE_PRICE_ENV_KEYS = [
  'STRIPE_ENTERPRISE_BASE_MONTHLY_PRICE_ID',
  'STRIPE_ENTERPRISE_BASE_ANNUAL_PRICE_ID',
  'STRIPE_ENTERPRISE_PER_SEAT_MONTHLY_PRICE_ID',
  'STRIPE_ENTERPRISE_PER_SEAT_ANNUAL_PRICE_ID',
] as const

/** Fail fast with a clear message if any Enterprise price ID env var is missing. */
export function assertEnterprisePriceEnvConfigured(): void {
  for (const key of ENTERPRISE_PRICE_ENV_KEYS) {
    if (!process.env[key]) {
      throw new Error(`${key} is not configured`)
    }
  }
}

export function getEnterpriseBasePriceId(
  interval: EnterpriseBillingInterval = 'monthly',
): string {
  const id = interval === 'annual'
    ? process.env.STRIPE_ENTERPRISE_BASE_ANNUAL_PRICE_ID
    : process.env.STRIPE_ENTERPRISE_BASE_MONTHLY_PRICE_ID

  if (!id) {
    throw new Error(
      interval === 'annual'
        ? 'STRIPE_ENTERPRISE_BASE_ANNUAL_PRICE_ID is not configured'
        : 'STRIPE_ENTERPRISE_BASE_MONTHLY_PRICE_ID is not configured',
    )
  }
  return id
}

export function getEnterprisePerSeatPriceId(
  interval: EnterpriseBillingInterval = 'monthly',
): string {
  const id = interval === 'annual'
    ? process.env.STRIPE_ENTERPRISE_PER_SEAT_ANNUAL_PRICE_ID
    : process.env.STRIPE_ENTERPRISE_PER_SEAT_MONTHLY_PRICE_ID

  if (!id) {
    throw new Error(
      interval === 'annual'
        ? 'STRIPE_ENTERPRISE_PER_SEAT_ANNUAL_PRICE_ID is not configured'
        : 'STRIPE_ENTERPRISE_PER_SEAT_MONTHLY_PRICE_ID is not configured',
    )
  }
  return id
}

export function getAllEnterprisePriceIds(): string[] {
  return [
    process.env.STRIPE_ENTERPRISE_BASE_MONTHLY_PRICE_ID,
    process.env.STRIPE_ENTERPRISE_BASE_ANNUAL_PRICE_ID,
    process.env.STRIPE_ENTERPRISE_PER_SEAT_MONTHLY_PRICE_ID,
    process.env.STRIPE_ENTERPRISE_PER_SEAT_ANNUAL_PRICE_ID,
  ].filter((id): id is string => Boolean(id))
}

export function isEnterpriseBasePriceId(priceId: string): boolean {
  const ids = [
    process.env.STRIPE_ENTERPRISE_BASE_MONTHLY_PRICE_ID,
    process.env.STRIPE_ENTERPRISE_BASE_ANNUAL_PRICE_ID,
  ].filter(Boolean)
  return ids.includes(priceId)
}

export function isEnterprisePerSeatPriceId(priceId: string): boolean {
  const ids = [
    process.env.STRIPE_ENTERPRISE_PER_SEAT_MONTHLY_PRICE_ID,
    process.env.STRIPE_ENTERPRISE_PER_SEAT_ANNUAL_PRICE_ID,
  ].filter(Boolean)
  return ids.includes(priceId)
}

export function isEnterprisePriceId(priceId: string): boolean {
  return getAllEnterprisePriceIds().includes(priceId)
}

export function enterpriseIntervalFromStripeRecurring(
  interval: string | null | undefined,
): EnterpriseBillingInterval {
  return interval === 'year' ? 'annual' : 'monthly'
}

/** @deprecated Use paymentMethodTypesForTier('enterprise', interval) */
export function paymentMethodTypesForBillingInterval(
  interval: EnterpriseBillingInterval,
): Array<'card' | 'us_bank_account'> {
  return paymentMethodTypesForTier('enterprise', interval)
}

/** Billable extra seats beyond the included base_seat_count. */
export function billableExtraSeats(activeMemberCount: number, baseSeatCount: number): number {
  return Math.max(0, activeMemberCount - baseSeatCount)
}

export function paymentMethodFromStripeType(
  type: string,
): 'card' | 'ach' | null {
  if (type === 'card') return 'card'
  if (type === 'us_bank_account') return 'ach'
  return null
}

export function seatChangeStatusForPaymentMethod(
  method: 'card' | 'ach' | null,
): 'pending' | 'confirmed' {
  return method === 'ach' ? 'pending' : 'confirmed'
}
