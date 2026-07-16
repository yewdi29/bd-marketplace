/** Enterprise Stripe price IDs — set via env after running scripts/setup-enterprise-stripe.mjs */

export type EnterpriseBillingInterval = 'monthly' | 'annual'

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

/**
 * Annual plans are ACH-only (same product rule as Max-tier annual billing).
 * Monthly plans accept card and ACH.
 */
export function paymentMethodTypesForBillingInterval(
  interval: EnterpriseBillingInterval,
): Array<'card' | 'us_bank_account'> {
  if (interval === 'annual') {
    return ['us_bank_account']
  }
  return ['card', 'us_bank_account']
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
