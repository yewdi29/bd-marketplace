import { createElement } from 'react'
import type Stripe from 'stripe'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { MembershipPlan } from '@/lib/types/database'
import { PAID_MEMBERSHIP_TIERS, type PaidTierId } from '@/lib/pricing/membershipTiers'
import { isEnterprisePriceId } from '@/lib/stripe/enterpriseConfig'
import {
  getOrganizationByStripeSubscriptionId,
  isEnterpriseSubscriptionMetadata,
} from '@/lib/stripe/enterpriseSubscription'
import { getInvoiceSubscriptionId } from '@/lib/stripe/invoiceHelpers'
import { stripe } from '@/lib/rigburrito/stripe'
import SubscriptionConfirmed from '../../../emails/templates/SubscriptionConfirmed'
import PaymentFailed from '../../../emails/templates/PaymentFailed'
import UpcomingRenewal from '../../../emails/templates/UpcomingRenewal'
import { getEmailAppUrl } from './resendClient'
import { sendTransactionalEmailSafe } from './sendTransactionalEmail'

const PLAN_RANK: Record<MembershipPlan, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  max: 3,
  premium: 3,
}

const PLAN_LABELS: Record<MembershipPlan, string> = {
  free: 'Free',
  starter: 'Starter',
  pro: 'Pro',
  max: 'Max',
  premium: 'Premium',
}

export function isPaidPlan(plan: MembershipPlan): boolean {
  return plan === 'starter' || plan === 'pro' || plan === 'max' || plan === 'premium'
}

/** True when moving to a higher paid tier (includes free → any paid). */
export function isPaidPlanUpgrade(from: MembershipPlan, to: MembershipPlan): boolean {
  return isPaidPlan(to) && PLAN_RANK[to] > PLAN_RANK[from]
}

export function planDisplayLabel(plan: MembershipPlan): string {
  return PLAN_LABELS[plan] ?? plan
}

/**
 * Feature bullets for confirmation emails — same source as /pricing and /dashboard/upgrade
 * (PAID_MEMBERSHIP_TIERS included items only).
 */
export function includedFeaturesForPlan(plan: MembershipPlan): string[] {
  if (plan === 'premium') {
    const tier = PAID_MEMBERSHIP_TIERS.find(t => t.id === 'max')
    return (tier?.features ?? []).filter(f => f.included).map(f => f.label)
  }
  if (plan === 'free') return []
  const tier = PAID_MEMBERSHIP_TIERS.find(t => t.id === (plan as PaidTierId))
  return (tier?.features ?? []).filter(f => f.included).map(f => f.label)
}

function planIdForEmail(plan: MembershipPlan): 'starter' | 'pro' | 'max' | 'premium' {
  if (plan === 'starter' || plan === 'pro' || plan === 'max' || plan === 'premium') return plan
  return 'starter'
}

function settingsUrl(): string {
  return `${getEmailAppUrl()}/dashboard/settings`
}

async function createBillingPortalUrl(customerId: string | null | undefined): Promise<string> {
  if (!customerId) return settingsUrl()
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: settingsUrl(),
    })
    return session.url ?? settingsUrl()
  } catch (err) {
    console.error('[individualBillingEmails] portal session failed:', err)
    return settingsUrl()
  }
}

function formatUsdFromCents(cents: number, currency = 'usd'): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(cents / 100)
  } catch {
    return `$${(cents / 100).toFixed(2)}`
  }
}

function formatDate(unixSeconds: number | null | undefined): string {
  if (!unixSeconds) return 'soon'
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(unixSeconds * 1000))
}

async function loadUserForEmail(
  service: SupabaseClient,
  userId: string,
): Promise<{ email: string; full_name: string | null; stripe_customer_id: string | null } | null> {
  const { data } = await service
    .from('users')
    .select('email, full_name, stripe_customer_id')
    .eq('id', userId)
    .maybeSingle()

  if (!data?.email) return null
  return data
}

function firstNameFrom(fullName: string | null | undefined): string | null {
  const part = fullName?.trim()?.split(/\s+/)[0]
  return part || null
}

/**
 * After individual checkout applies a plan change: send SubscriptionConfirmed
 * only when the user moved up into a paid tier (or free → paid).
 */
export async function dispatchSubscriptionConfirmedIfUpgrade(opts: {
  service: SupabaseClient
  userId: string
  previousPlan: MembershipPlan
  newPlan: MembershipPlan
  billingPeriod: 'monthly' | 'annual' | null
}): Promise<void> {
  if (!isPaidPlanUpgrade(opts.previousPlan, opts.newPlan)) return

  const user = await loadUserForEmail(opts.service, opts.userId)
  if (!user) return

  const manageBillingUrl = await createBillingPortalUrl(user.stripe_customer_id)
  const planLabel = planDisplayLabel(opts.newPlan)
  const periodLabel =
    opts.billingPeriod === 'annual'
      ? 'annual'
      : opts.billingPeriod === 'monthly'
        ? 'monthly'
        : null

  sendTransactionalEmailSafe({
    templateType: 'SubscriptionConfirmed',
    recipientEmail: user.email,
    relatedEntityType: 'user',
    relatedEntityId: opts.userId,
    subject: `You're on the ${planLabel} plan — Black Diamond Marketplace`,
    react: createElement(SubscriptionConfirmed, {
      firstName: firstNameFrom(user.full_name),
      planId: planIdForEmail(opts.newPlan),
      planLabel,
      billingPeriodLabel: periodLabel,
      features: includedFeaturesForPlan(opts.newPlan),
      manageBillingUrl,
    }),
  })
}

/** Resolve an individual (non-Enterprise) user for an invoice subscription, or null. */
export async function resolveIndividualUserForInvoice(
  service: SupabaseClient,
  invoice: Stripe.Invoice,
): Promise<{
  userId: string
  email: string
  fullName: string | null
  customerId: string | null
  plan: MembershipPlan
  subscriptionId: string
} | null> {
  const subscriptionId = getInvoiceSubscriptionId(invoice)
  if (!subscriptionId) return null

  // Enterprise org path — leave to existing Enterprise handlers
  const org = await getOrganizationByStripeSubscriptionId(service, subscriptionId)
  if (org) return null

  let sub: Stripe.Subscription
  try {
    sub = await stripe.subscriptions.retrieve(subscriptionId)
  } catch (err) {
    console.error('[individualBillingEmails] subscription retrieve failed:', err)
    return null
  }

  if (isEnterpriseSubscriptionMetadata(sub.metadata)) return null

  const priceId = sub.items.data[0]?.price?.id
  if (!priceId || isEnterprisePriceId(priceId)) return null

  const customerId =
    typeof invoice.customer === 'string'
      ? invoice.customer
      : invoice.customer && typeof invoice.customer === 'object'
        ? invoice.customer.id
        : typeof sub.customer === 'string'
          ? sub.customer
          : sub.customer?.id ?? null

  type UserBillingRow = {
    id: string
    email: string
    full_name: string | null
    stripe_customer_id: string | null
    plan: MembershipPlan | null
  }

  const metaUserId = sub.metadata?.supabase_user_id
  let userRow: UserBillingRow | null = null

  if (metaUserId) {
    const { data } = await service
      .from('users')
      .select('id, email, full_name, stripe_customer_id, plan')
      .eq('id', metaUserId)
      .maybeSingle()
    if (data) userRow = data as UserBillingRow
  }

  if (!userRow) {
    const { data } = await service
      .from('users')
      .select('id, email, full_name, stripe_customer_id, plan')
      .eq('stripe_subscription_id', subscriptionId)
      .maybeSingle()
    if (data) userRow = data as UserBillingRow
  }

  if (!userRow && customerId) {
    const { data } = await service
      .from('users')
      .select('id, email, full_name, stripe_customer_id, plan')
      .eq('stripe_customer_id', customerId)
      .maybeSingle()
    if (data) userRow = data as UserBillingRow
  }

  if (!userRow?.email) return null

  return {
    userId: userRow.id,
    email: userRow.email,
    fullName: userRow.full_name,
    customerId: userRow.stripe_customer_id ?? customerId,
    plan: (userRow.plan ?? 'free') as MembershipPlan,
    subscriptionId,
  }
}

/**
 * Individual-tier invoice.payment_failed — parallel to Enterprise handler.
 * No-ops when the invoice belongs to an Enterprise org subscription.
 */
export async function handleIndividualInvoicePaymentFailed(
  service: SupabaseClient,
  invoice: Stripe.Invoice,
): Promise<void> {
  const user = await resolveIndividualUserForInvoice(service, invoice)
  if (!user) return

  const updatePaymentUrl = await createBillingPortalUrl(user.customerId)
  const amountDue = formatUsdFromCents(invoice.amount_due ?? 0, invoice.currency ?? 'usd')
  const planLabel = planDisplayLabel(user.plan)

  sendTransactionalEmailSafe({
    templateType: 'PaymentFailed',
    recipientEmail: user.email,
    relatedEntityType: 'user',
    relatedEntityId: user.userId,
    subject: `Payment failed for your ${planLabel} plan`,
    react: createElement(PaymentFailed, {
      firstName: firstNameFrom(user.fullName),
      planLabel,
      amountDue,
      updatePaymentUrl,
    }),
  })
}

/**
 * Individual-tier invoice.upcoming — not used by Enterprise handlers.
 */
export async function handleIndividualInvoiceUpcoming(
  service: SupabaseClient,
  invoice: Stripe.Invoice,
): Promise<void> {
  const user = await resolveIndividualUserForInvoice(service, invoice)
  if (!user) return

  const manageBillingUrl = await createBillingPortalUrl(user.customerId)
  const amountDue = formatUsdFromCents(invoice.amount_due ?? 0, invoice.currency ?? 'usd')
  const renewalDate = formatDate(invoice.period_end ?? invoice.next_payment_attempt)
  const planLabel = planDisplayLabel(user.plan)

  sendTransactionalEmailSafe({
    templateType: 'UpcomingRenewal',
    recipientEmail: user.email,
    relatedEntityType: 'user',
    relatedEntityId: user.userId,
    subject: `Your ${planLabel} plan renews on ${renewalDate}`,
    react: createElement(UpcomingRenewal, {
      firstName: firstNameFrom(user.fullName),
      planLabel,
      amountDue,
      renewalDate,
      manageBillingUrl,
    }),
  })
}
