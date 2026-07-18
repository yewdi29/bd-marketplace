export type CheckoutTier = 'starter' | 'pro' | 'max' | 'enterprise'
export type CheckoutBillingInterval = 'monthly' | 'annual'

export type StripeCheckoutPaymentMethod = 'card' | 'us_bank_account'

/**
 * Payment methods accepted at Stripe Checkout by tier and interval.
 *
 * | Tier       | Monthly | Annual              |
 * |------------|---------|---------------------|
 * | Starter    | card    | card                |
 * | Pro        | card    | card + ACH          |
 * | Max        | card    | card + ACH          |
 * | Enterprise | card    | card + ACH          |
 */
export function paymentMethodTypesForTier(
  tier: CheckoutTier,
  interval: CheckoutBillingInterval,
): StripeCheckoutPaymentMethod[] {
  if (tier === 'starter') {
    return ['card']
  }
  if (interval === 'monthly') {
    return ['card']
  }
  return ['card', 'us_bank_account']
}

export function formatPaymentMethodTypesLabel(
  types: StripeCheckoutPaymentMethod[],
): string {
  return types
    .map(t => (t === 'us_bank_account' ? 'ACH bank debit' : 'Card'))
    .join(' or ')
}
