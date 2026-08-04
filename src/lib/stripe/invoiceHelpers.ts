import type Stripe from 'stripe'

/** Subscription id from an invoice — supports legacy `.subscription` and newer `parent` shape. */
export function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const legacy = (invoice as Stripe.Invoice & {
    subscription?: string | Stripe.Subscription | null
  }).subscription

  if (typeof legacy === 'string') return legacy
  if (legacy && typeof legacy === 'object') return legacy.id

  const parentSub = invoice.parent?.subscription_details?.subscription
  if (typeof parentSub === 'string') return parentSub
  if (parentSub && typeof parentSub === 'object' && 'id' in parentSub) {
    return (parentSub as Stripe.Subscription).id
  }

  return null
}
