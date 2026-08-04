import type { SupabaseClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'
import { stripe } from '@/lib/rigburrito/stripe'
import {
  assertEnterprisePriceEnvConfigured,
  billableExtraSeats,
  enterpriseIntervalFromStripeRecurring,
  getEnterpriseBasePriceId,
  getEnterprisePerSeatPriceId,
  isEnterpriseBasePriceId,
  isEnterprisePerSeatPriceId,
  paymentMethodFromStripeType,
  seatChangeStatusForPaymentMethod,
  type EnterpriseBillingInterval,
} from '@/lib/stripe/enterpriseConfig'
import { paymentMethodTypesForTier } from '@/lib/stripe/paymentMethodTypes'
import type { OrgPreferredPaymentMethod } from '@/lib/types/database'

export interface OrganizationRow {
  id: string
  name: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  base_seat_count: number
  preferred_payment_method: OrgPreferredPaymentMethod | null
  billing_interval: EnterpriseBillingInterval | null
  enterprise_terms_accepted_at: string | null
  enterprise_terms_version: string | null
}

export interface SubscriptionItemIds {
  baseItemId: string
  perSeatItemId: string
  perSeatQuantity: number
}

export async function getOrganizationById(
  service: SupabaseClient,
  organizationId: string,
): Promise<OrganizationRow | null> {
  const { data, error } = await service
    .from('organizations')
    .select('id, name, stripe_customer_id, stripe_subscription_id, base_seat_count, preferred_payment_method, billing_interval, enterprise_terms_accepted_at, enterprise_terms_version')
    .eq('id', organizationId)
    .single()

  if (error || !data) return null
  return data as OrganizationRow
}

export async function getOrganizationByStripeSubscriptionId(
  service: SupabaseClient,
  subscriptionId: string,
): Promise<OrganizationRow | null> {
  const { data, error } = await service
    .from('organizations')
    .select('id, name, stripe_customer_id, stripe_subscription_id, base_seat_count, preferred_payment_method, billing_interval, enterprise_terms_accepted_at, enterprise_terms_version')
    .eq('stripe_subscription_id', subscriptionId)
    .maybeSingle()

  if (error || !data) return null
  return data as OrganizationRow
}

export async function countActiveOrgMembers(
  service: SupabaseClient,
  organizationId: string,
): Promise<number> {
  const { count, error } = await service
    .from('org_members')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('status', 'active')

  if (error) throw new Error(error.message)
  return count ?? 0
}

export async function getEnterpriseBillingInterval(
  subscriptionId: string,
): Promise<EnterpriseBillingInterval> {
  const sub = await stripe.subscriptions.retrieve(subscriptionId)
  const baseItem = findEnterpriseBaseItem(sub)
  if (!baseItem) {
    throw new Error('Enterprise subscription is missing a base line item')
  }
  return enterpriseIntervalFromStripeRecurring(baseItem.price.recurring?.interval)
}

function findEnterpriseBaseItem(sub: Stripe.Subscription) {
  return sub.items.data.find(item =>
    item.price.metadata?.component === 'base' || isEnterpriseBasePriceId(item.price.id),
  )
}

function findEnterprisePerSeatItem(sub: Stripe.Subscription) {
  return sub.items.data.find(item =>
    item.price.metadata?.component === 'per_seat' || isEnterprisePerSeatPriceId(item.price.id),
  )
}

export async function getSubscriptionItemIds(
  subscriptionId: string,
): Promise<SubscriptionItemIds> {
  const sub = await stripe.subscriptions.retrieve(subscriptionId)
  const baseItem = findEnterpriseBaseItem(sub)
  const perSeatItem = findEnterprisePerSeatItem(sub)

  if (!baseItem || !perSeatItem) {
    throw new Error('Enterprise subscription is missing expected base or per-seat line items')
  }

  return {
    baseItemId: baseItem.id,
    perSeatItemId: perSeatItem.id,
    perSeatQuantity: perSeatItem.quantity ?? 0,
  }
}

export async function createOrganizationStripeCustomer(
  service: SupabaseClient,
  organizationId: string,
  primaryOwnerEmail: string,
  billingInterval: EnterpriseBillingInterval = 'monthly',
): Promise<{ customerId: string; billingInterval: EnterpriseBillingInterval }> {
  const org = await getOrganizationById(service, organizationId)
  if (!org) {
    throw new Error('Organization not found')
  }
  if (org.stripe_customer_id) {
    throw new Error('Organization already has a Stripe customer')
  }

  const customer = await stripe.customers.create({
    email: primaryOwnerEmail,
    name: org.name,
    metadata: {
      organization_id: organizationId,
      subscription_type: 'enterprise',
    },
  })

  const { error: updateError } = await service
    .from('organizations')
    .update({
      stripe_customer_id: customer.id,
      billing_interval: billingInterval,
    })
    .eq('id', organizationId)

  if (updateError) {
    throw new Error(`Failed to persist Stripe customer: ${updateError.message}`)
  }

  return { customerId: customer.id, billingInterval }
}

/**
 * @deprecated Initial subscriptions are created via Stripe Checkout at invite acceptance.
 * Kept for manual recovery of legacy orgs created before the Checkout migration.
 */
export async function createOrganizationSubscription(
  service: SupabaseClient,
  organizationId: string,
  primaryOwnerEmail: string,
  billingInterval: EnterpriseBillingInterval = 'monthly',
): Promise<{ customerId: string; subscriptionId: string; billingInterval: EnterpriseBillingInterval }> {
  const org = await getOrganizationById(service, organizationId)
  if (!org) {
    throw new Error('Organization not found')
  }
  if (org.stripe_subscription_id) {
    throw new Error('Organization already has a Stripe subscription')
  }

  const basePriceId = getEnterpriseBasePriceId(billingInterval)
  const perSeatPriceId = getEnterprisePerSeatPriceId(billingInterval)

  let customerId = org.stripe_customer_id

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: primaryOwnerEmail,
      name: org.name,
      metadata: {
        organization_id: organizationId,
        subscription_type: 'enterprise',
      },
    })
    customerId = customer.id
  } else {
    await stripe.customers.update(customerId, {
      email: primaryOwnerEmail,
      metadata: {
        organization_id: organizationId,
        subscription_type: 'enterprise',
      },
    })
  }

  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [
      { price: basePriceId, quantity: 1 },
      { price: perSeatPriceId, quantity: 0 },
    ],
    metadata: {
      organization_id: organizationId,
      subscription_type: 'enterprise',
      billing_interval: billingInterval,
    },
    payment_behavior: 'default_incomplete',
  })

  const { error: updateError } = await service
    .from('organizations')
    .update({
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
    })
    .eq('id', organizationId)

  if (updateError) {
    throw new Error(`Failed to persist Stripe IDs: ${updateError.message}`)
  }

  return { customerId, subscriptionId: subscription.id, billingInterval }
}

export interface CreateOrganizationCheckoutOptions {
  returnUrl: string
  billingInterval: EnterpriseBillingInterval
  termsVersion: string
  couponId?: string
  promotionCodeId?: string
}

export async function createOrganizationCheckoutSession(
  org: OrganizationRow,
  options: CreateOrganizationCheckoutOptions,
): Promise<string> {
  if (!org.stripe_customer_id) {
    throw new Error('Organization does not have a Stripe customer yet')
  }
  if (org.stripe_subscription_id) {
    throw new Error('Organization already has an active subscription')
  }

  const { billingInterval, returnUrl, termsVersion, couponId, promotionCodeId } = options
  const basePriceId = getEnterpriseBasePriceId(billingInterval)
  const paymentMethodTypes = paymentMethodTypesForTier('enterprise', billingInterval)

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    customer: org.stripe_customer_id,
    mode: 'subscription',
    line_items: [{ price: basePriceId, quantity: 1 }],
    payment_method_types: paymentMethodTypes,
    payment_method_options: {
      us_bank_account: {
        financial_connections: {
          permissions: ['payment_method'],
        },
        verification_method: 'instant',
      },
    },
    subscription_data: {
      metadata: {
        organization_id: org.id,
        subscription_type: 'enterprise',
        billing_interval: billingInterval,
      },
    },
    consent_collection: {
      terms_of_service: 'required',
    },
    success_url: `${returnUrl}?checkout=success`,
    cancel_url: `${returnUrl}?checkout=cancelled`,
    metadata: {
      organization_id: org.id,
      setup_type: 'enterprise_subscription',
      billing_interval: billingInterval,
      enterprise_terms_version: termsVersion,
    },
  }

  if (couponId) {
    sessionParams.discounts = [{ coupon: couponId }]
  } else if (promotionCodeId) {
    sessionParams.discounts = [{ promotion_code: promotionCodeId }]
  }

  const session = await stripe.checkout.sessions.create(sessionParams)

  if (!session.url) {
    throw new Error('Stripe did not return a Checkout Session URL')
  }

  return session.url
}

/** @deprecated Use createOrganizationCheckoutSession — setup mode replaced by subscription Checkout. */
export async function createOrganizationPaymentSetupSession(
  org: OrganizationRow,
  returnUrl: string,
): Promise<string> {
  if (!org.stripe_customer_id) {
    throw new Error('Organization does not have a Stripe customer yet')
  }
  if (!org.stripe_subscription_id) {
    throw new Error('Organization does not have a Stripe subscription yet')
  }

  const billingInterval = await getEnterpriseBillingInterval(org.stripe_subscription_id)
  const paymentMethodTypes = paymentMethodTypesForTier('enterprise', billingInterval)

  const session = await stripe.checkout.sessions.create({
    customer: org.stripe_customer_id,
    mode: 'setup',
    payment_method_types: paymentMethodTypes,
    payment_method_options: {
      us_bank_account: {
        financial_connections: {
          permissions: ['payment_method'],
        },
        verification_method: 'instant',
      },
    },
    success_url: `${returnUrl}?payment_setup=success`,
    cancel_url: `${returnUrl}?payment_setup=cancelled`,
    metadata: {
      organization_id: org.id,
      setup_type: 'enterprise_payment_method',
      billing_interval: billingInterval,
    },
  })

  if (!session.url) {
    throw new Error('Stripe did not return a Checkout Session URL')
  }

  return session.url
}

export async function applyOrganizationPaymentMethod(
  service: SupabaseClient,
  organizationId: string,
  paymentMethodId: string,
): Promise<OrgPreferredPaymentMethod | null> {
  const org = await getOrganizationById(service, organizationId)
  if (!org?.stripe_customer_id) {
    throw new Error('Organization not found or missing Stripe customer')
  }

  const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)
  const preferred = paymentMethodFromStripeType(paymentMethod.type)

  await stripe.paymentMethods.attach(paymentMethodId, {
    customer: org.stripe_customer_id,
  }).catch(err => {
    // Already attached to this customer — safe to continue
    if (!(err instanceof Error) || !err.message.includes('already been attached')) {
      throw err
    }
  })

  await stripe.customers.update(org.stripe_customer_id, {
    invoice_settings: { default_payment_method: paymentMethodId },
  })

  if (org.stripe_subscription_id) {
    await stripe.subscriptions.update(org.stripe_subscription_id, {
      default_payment_method: paymentMethodId,
    })
  }

  if (preferred) {
    await service
      .from('organizations')
      .update({
        preferred_payment_method: preferred,
        last_billing_failure_at: null,
        last_billing_failure_message: null,
      })
      .eq('id', organizationId)
  }

  return preferred
}

export interface SeatChangePreview {
  activeMemberCount: number
  projectedMemberCount: number
  baseSeatCount: number
  extraSeatsBefore: number
  extraSeatsAfter: number
  perSeatQuantityBefore: number
  perSeatQuantityAfter: number
  proratedAmountCents: number
  proratedAmount: number
  requiresBillingChange: boolean
  billingInterval: EnterpriseBillingInterval
}

async function buildSeatPreview(
  org: OrganizationRow,
  activeMemberCount: number,
  projectedMemberCount: number,
): Promise<SeatChangePreview> {
  if (!org.stripe_subscription_id) {
    throw new Error('Organization does not have a Stripe subscription')
  }

  const items = await getSubscriptionItemIds(org.stripe_subscription_id)
  const billingInterval = await getEnterpriseBillingInterval(org.stripe_subscription_id)
  const extraSeatsBefore = items.perSeatQuantity
  const extraSeatsAfter = billableExtraSeats(projectedMemberCount, org.base_seat_count)
  const requiresBillingChange = extraSeatsAfter !== extraSeatsBefore

  let proratedAmountCents = 0

  if (requiresBillingChange && org.stripe_customer_id) {
    const preview = await stripe.invoices.createPreview({
      customer: org.stripe_customer_id,
      subscription: org.stripe_subscription_id,
      subscription_details: {
        items: [{ id: items.perSeatItemId, quantity: extraSeatsAfter }],
        proration_behavior: 'create_prorations',
      },
    })
    proratedAmountCents = preview.amount_due ?? 0
  }

  return {
    activeMemberCount,
    projectedMemberCount,
    baseSeatCount: org.base_seat_count,
    extraSeatsBefore,
    extraSeatsAfter,
    perSeatQuantityBefore: extraSeatsBefore,
    perSeatQuantityAfter: extraSeatsAfter,
    proratedAmountCents,
    proratedAmount: proratedAmountCents / 100,
    requiresBillingChange,
    billingInterval,
  }
}

export async function previewAddSeat(
  service: SupabaseClient,
  organizationId: string,
): Promise<SeatChangePreview> {
  const org = await getOrganizationById(service, organizationId)
  if (!org) throw new Error('Organization not found')

  const activeCount = await countActiveOrgMembers(service, organizationId)
  return buildSeatPreview(org, activeCount, activeCount + 1)
}

export async function previewRemoveSeat(
  service: SupabaseClient,
  organizationId: string,
): Promise<SeatChangePreview> {
  const org = await getOrganizationById(service, organizationId)
  if (!org) throw new Error('Organization not found')

  const activeCount = await countActiveOrgMembers(service, organizationId)
  if (activeCount <= 0) {
    throw new Error('Organization has no active members to remove a seat from')
  }

  return buildSeatPreview(org, activeCount, activeCount - 1)
}

export async function confirmSeatQuantityChange(
  service: SupabaseClient,
  organizationId: string,
  changeType: 'add' | 'remove',
  activeMemberCount: number,
  projectedMemberCount: number,
): Promise<{ preview: SeatChangePreview; logId: string }> {
  const org = await getOrganizationById(service, organizationId)
  if (!org) throw new Error('Organization not found')
  if (!org.stripe_subscription_id || !org.stripe_customer_id) {
    throw new Error('Organization billing is not fully configured')
  }
  if (!org.preferred_payment_method) {
    throw new Error('Complete payment method setup before changing seats')
  }

  const preview = await buildSeatPreview(org, activeMemberCount, projectedMemberCount)

  if (preview.requiresBillingChange) {
    const items = await getSubscriptionItemIds(org.stripe_subscription_id)
    await stripe.subscriptions.update(org.stripe_subscription_id, {
      items: [{ id: items.perSeatItemId, quantity: preview.extraSeatsAfter }],
      proration_behavior: 'always_invoice',
    })
  }

  const logStatus = seatChangeStatusForPaymentMethod(org.preferred_payment_method)

  const { data: logRow, error: logError } = await service
    .from('seat_change_log')
    .insert({
      organization_id: organizationId,
      change_type: changeType,
      seat_count_before: preview.activeMemberCount,
      seat_count_after: preview.projectedMemberCount,
      prorated_amount: preview.requiresBillingChange ? preview.proratedAmount : null,
      payment_method_used: org.preferred_payment_method,
      status: preview.requiresBillingChange ? logStatus : 'confirmed',
    })
    .select('id')
    .single()

  if (logError || !logRow) {
    throw new Error(logError?.message ?? 'Failed to write seat change log')
  }

  return { preview, logId: logRow.id }
}

export type SeatConfirmActor = {
  userId?: string | null
  name?: string | null
}

export async function confirmAddSeat(
  service: SupabaseClient,
  organizationId: string,
  actor?: SeatConfirmActor | null,
): Promise<{ preview: SeatChangePreview; logId: string }> {
  const activeCount = await countActiveOrgMembers(service, organizationId)
  const result = await confirmSeatQuantityChange(
    service,
    organizationId,
    'add',
    activeCount,
    activeCount + 1,
  )

  // Additive only — after Stripe + seat_change_log succeed. Never reorder the commit above.
  const { dispatchSeatBillingReceiptSafe } = await import('@/lib/email/seatBillingReceipt')
  dispatchSeatBillingReceiptSafe({
    service,
    organizationId,
    changeType: 'add',
    preview: result.preview,
    logId: result.logId,
    actor: actor ?? null,
  })

  return result
}

export async function confirmRemoveSeat(
  service: SupabaseClient,
  organizationId: string,
  actor?: SeatConfirmActor | null,
): Promise<{ preview: SeatChangePreview; logId: string }> {
  const activeCount = await countActiveOrgMembers(service, organizationId)
  if (activeCount <= 0) {
    throw new Error('Organization has no active members to remove a seat from')
  }
  const result = await confirmSeatQuantityChange(
    service,
    organizationId,
    'remove',
    activeCount,
    activeCount - 1,
  )

  // Additive only — after Stripe + seat_change_log succeed. Never reorder the commit above.
  const { dispatchSeatBillingReceiptSafe } = await import('@/lib/email/seatBillingReceipt')
  dispatchSeatBillingReceiptSafe({
    service,
    organizationId,
    changeType: 'remove',
    preview: result.preview,
    logId: result.logId,
    actor: actor ?? null,
  })

  return result
}

export interface SeatReconciliationResult {
  organizationId: string
  activeMemberCount: number
  baseSeatCount: number
  expectedPerSeatQuantity: number
  stripePerSeatQuantity: number | null
  inSync: boolean
  message: string
}

export async function reconcileOrganizationSeats(
  service: SupabaseClient,
  organizationId: string,
): Promise<SeatReconciliationResult> {
  const org = await getOrganizationById(service, organizationId)
  if (!org) throw new Error('Organization not found')

  const activeMemberCount = await countActiveOrgMembers(service, organizationId)
  const expectedPerSeatQuantity = billableExtraSeats(activeMemberCount, org.base_seat_count)

  if (!org.stripe_subscription_id) {
    return {
      organizationId,
      activeMemberCount,
      baseSeatCount: org.base_seat_count,
      expectedPerSeatQuantity,
      stripePerSeatQuantity: null,
      inSync: expectedPerSeatQuantity === 0,
      message: 'No Stripe subscription on file',
    }
  }

  const items = await getSubscriptionItemIds(org.stripe_subscription_id)
  const inSync = items.perSeatQuantity === expectedPerSeatQuantity

  return {
    organizationId,
    activeMemberCount,
    baseSeatCount: org.base_seat_count,
    expectedPerSeatQuantity,
    stripePerSeatQuantity: items.perSeatQuantity,
    inSync,
    message: inSync
      ? 'Seat counts are in sync'
      : `Mismatch: Stripe per-seat quantity is ${items.perSeatQuantity}, expected ${expectedPerSeatQuantity} based on ${activeMemberCount} active members`,
  }
}

export async function handleEnterpriseCheckoutSetupCompleted(
  service: SupabaseClient,
  session: Stripe.Checkout.Session,
): Promise<void> {
  const organizationId = session.metadata?.organization_id
  if (!organizationId) return

  const setupIntentId = typeof session.setup_intent === 'string'
    ? session.setup_intent
    : session.setup_intent?.id

  if (!setupIntentId) {
    throw new Error('Checkout setup session missing setup_intent')
  }

  const setupIntent = await stripe.setupIntents.retrieve(setupIntentId)
  const paymentMethodId = typeof setupIntent.payment_method === 'string'
    ? setupIntent.payment_method
    : setupIntent.payment_method?.id

  if (!paymentMethodId) {
    throw new Error('SetupIntent missing payment_method')
  }

  await applyOrganizationPaymentMethod(service, organizationId, paymentMethodId)
}

function resolveEnterpriseBillingIntervalFromSubscription(
  sub: Stripe.Subscription,
  metadataIntervalRaw: string | null | undefined,
  logContext: { organizationId: string; subscriptionId: string },
): EnterpriseBillingInterval {
  const baseItem = findEnterpriseBaseItem(sub)
  if (!baseItem) {
    throw new Error('Enterprise subscription is missing a base line item')
  }

  const fromSubscription = enterpriseIntervalFromStripeRecurring(
    baseItem.price.recurring?.interval,
  )

  const fromMetadata: EnterpriseBillingInterval =
    metadataIntervalRaw === 'annual' ? 'annual' : 'monthly'

  if (metadataIntervalRaw && fromMetadata !== fromSubscription) {
    console.warn(
      '[enterprise checkout] billing_interval metadata mismatch — using subscription interval',
      {
        organizationId: logContext.organizationId,
        subscriptionId: logContext.subscriptionId,
        metadataInterval: fromMetadata,
        subscriptionInterval: fromSubscription,
      },
    )
  }

  return fromSubscription
}

async function ensureEnterprisePerSeatLineItem(subscriptionId: string): Promise<void> {
  assertEnterprisePriceEnvConfigured()

  const sub = await stripe.subscriptions.retrieve(subscriptionId)
  if (findEnterprisePerSeatItem(sub)) {
    return
  }

  const baseItem = findEnterpriseBaseItem(sub)
  if (!baseItem) {
    throw new Error('Enterprise subscription is missing a base line item')
  }

  const billingInterval = enterpriseIntervalFromStripeRecurring(
    baseItem.price.recurring?.interval,
  )
  const perSeatPriceId = getEnterprisePerSeatPriceId(billingInterval)

  await stripe.subscriptions.update(subscriptionId, {
    items: [
      ...sub.items.data.map(item => ({ id: item.id })),
      { price: perSeatPriceId, quantity: 0 },
    ],
  })
}

export async function handleEnterpriseCheckoutSubscriptionCompleted(
  service: SupabaseClient,
  session: Stripe.Checkout.Session,
): Promise<void> {
  assertEnterprisePriceEnvConfigured()

  const organizationId = session.metadata?.organization_id
  if (!organizationId) return

  const subscriptionId = typeof session.subscription === 'string'
    ? session.subscription
    : session.subscription?.id

  if (!subscriptionId) {
    throw new Error('Enterprise Checkout session missing subscription')
  }

  const sub = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['default_payment_method'],
  })

  const billingInterval = resolveEnterpriseBillingIntervalFromSubscription(
    sub,
    session.metadata?.billing_interval,
    { organizationId, subscriptionId },
  )

  const orgUpdate: Record<string, unknown> = {
    stripe_subscription_id: subscriptionId,
    billing_interval: billingInterval,
  }

  const termsVersion = session.metadata?.enterprise_terms_version
  if (session.consent?.terms_of_service === 'accepted') {
    orgUpdate.enterprise_terms_accepted_at = new Date().toISOString()
    if (termsVersion) {
      orgUpdate.enterprise_terms_version = termsVersion
    }
  }

  const { error: orgError } = await service
    .from('organizations')
    .update(orgUpdate)
    .eq('id', organizationId)

  if (orgError) {
    throw new Error(`Failed to persist subscription: ${orgError.message}`)
  }

  await ensureEnterprisePerSeatLineItem(subscriptionId)

  const defaultPm = sub.default_payment_method
  const paymentMethodId = typeof defaultPm === 'string'
    ? defaultPm
    : defaultPm?.id

  if (paymentMethodId) {
    await applyOrganizationPaymentMethod(service, organizationId, paymentMethodId)
  }
}

function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const legacy = (invoice as Stripe.Invoice & {
    subscription?: string | Stripe.Subscription | null
  }).subscription

  if (typeof legacy === 'string') return legacy
  if (legacy && typeof legacy === 'object') return legacy.id

  const parentSub = invoice.parent?.subscription_details?.subscription
  if (typeof parentSub === 'string') return parentSub

  return null
}

export async function handleEnterpriseInvoicePaymentSucceeded(
  service: SupabaseClient,
  invoice: Stripe.Invoice,
): Promise<void> {
  const subscriptionId = getInvoiceSubscriptionId(invoice)
  if (!subscriptionId) return

  const org = await getOrganizationByStripeSubscriptionId(service, subscriptionId)
  if (!org) return

  const { data: pendingLog } = await service
    .from('seat_change_log')
    .select('id')
    .eq('organization_id', org.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (pendingLog) {
    await service
      .from('seat_change_log')
      .update({
        status: 'confirmed',
        stripe_invoice_id: invoice.id,
      })
      .eq('id', pendingLog.id)
  }

  await service
    .from('organizations')
    .update({
      last_billing_failure_at: null,
      last_billing_failure_message: null,
    })
    .eq('id', org.id)
}

export async function handleEnterpriseInvoicePaymentFailed(
  service: SupabaseClient,
  invoice: Stripe.Invoice,
): Promise<void> {
  const subscriptionId = getInvoiceSubscriptionId(invoice)
  if (!subscriptionId) return

  const org = await getOrganizationByStripeSubscriptionId(service, subscriptionId)
  if (!org) return

  const failureMessage =
    invoice.last_finalization_error?.message ??
    'Enterprise subscription invoice payment failed'

  const { data: pendingLog } = await service
    .from('seat_change_log')
    .select('id')
    .eq('organization_id', org.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (pendingLog) {
    await service
      .from('seat_change_log')
      .update({
        status: 'failed',
        stripe_invoice_id: invoice.id,
      })
      .eq('id', pendingLog.id)
  }

  await service
    .from('organizations')
    .update({
      last_billing_failure_at: new Date().toISOString(),
      last_billing_failure_message: failureMessage,
    })
    .eq('id', org.id)

  const { sendEnterprisePaymentFailedAlert } = await import(
    '@/lib/email/enterpriseBillingAlerts'
  )
  await sendEnterprisePaymentFailedAlert({
    organizationId: org.id,
    organizationName: org.name,
    invoiceId: invoice.id,
    amountDue: invoice.amount_due ?? 0,
    failureMessage,
  })
}

export function isEnterpriseSubscriptionMetadata(
  metadata: Stripe.Metadata | null | undefined,
): boolean {
  return metadata?.subscription_type === 'enterprise' || Boolean(metadata?.organization_id)
}
