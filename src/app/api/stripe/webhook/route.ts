import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import type { MembershipPlan } from '@/lib/types/database'
import { dispatchPlanDowngradeListingOverflowEmail } from '@/lib/email/transactionalEmails'
import {
  dispatchSubscriptionConfirmedIfUpgrade,
  handleIndividualInvoicePaymentFailed,
  handleIndividualInvoiceUpcoming,
} from '@/lib/email/individualBillingEmails'
import {
  getOrganizationByStripeSubscriptionId,
  handleEnterpriseCheckoutSetupCompleted,
  handleEnterpriseCheckoutSubscriptionCompleted,
  handleEnterpriseInvoicePaymentFailed,
  handleEnterpriseInvoicePaymentSucceeded,
  isEnterpriseSubscriptionMetadata,
} from '@/lib/stripe/enterpriseSubscription'
import { isEnterprisePriceId } from '@/lib/stripe/enterpriseConfig'
import { enforceListingOverflowForUser } from '@/lib/stripe/planListingOverflow'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-05-27.dahlia',
})

function getService() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

function tierFromPriceId(priceId: string): MembershipPlan {
  const map: Record<string, MembershipPlan> = {
    [process.env.STRIPE_STARTER_MONTHLY_PRICE_ID ?? '']: 'starter',
    [process.env.STRIPE_STARTER_ANNUAL_PRICE_ID  ?? '']: 'starter',
    [process.env.STRIPE_PRO_MONTHLY_PRICE_ID     ?? '']: 'pro',
    [process.env.STRIPE_PRO_ANNUAL_PRICE_ID      ?? '']: 'pro',
    [process.env.STRIPE_MAX_MONTHLY_PRICE_ID     ?? '']: 'max',
    [process.env.STRIPE_MAX_ANNUAL_PRICE_ID      ?? '']: 'max',
  }
  return map[priceId] ?? 'free'
}

function billingPeriodFromInterval(interval: string | null | undefined): 'monthly' | 'annual' {
  return interval === 'year' ? 'annual' : 'monthly'
}

async function isOrganizationSubscription(
  service: ReturnType<typeof getService>,
  subscriptionId: string,
): Promise<boolean> {
  const org = await getOrganizationByStripeSubscriptionId(service, subscriptionId)
  return Boolean(org)
}

function webhookErrorContext(event: Stripe.Event): Record<string, unknown> {
  const ctx: Record<string, unknown> = {
    eventId: event.id,
    eventType: event.type,
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    ctx.organizationId = session.metadata?.organization_id ?? null
    const subscription = session.subscription
    ctx.subscriptionId =
      typeof subscription === 'string' ? subscription : subscription?.id ?? null
    ctx.setupType = session.metadata?.setup_type ?? null
  }

  if (
    event.type === 'customer.subscription.updated' ||
    event.type === 'customer.subscription.deleted'
  ) {
    const sub = event.data.object as Stripe.Subscription
    ctx.subscriptionId = sub.id
    ctx.organizationId = sub.metadata?.organization_id ?? null
  }

  if (
    event.type === 'invoice.payment_succeeded' ||
    event.type === 'invoice.payment_failed' ||
    event.type === 'invoice.upcoming'
  ) {
    const invoice = event.data.object as Stripe.Invoice
    const legacy = (invoice as Stripe.Invoice & {
      subscription?: string | Stripe.Subscription | null
    }).subscription
    if (typeof legacy === 'string') {
      ctx.subscriptionId = legacy
    } else if (legacy && typeof legacy === 'object') {
      ctx.subscriptionId = legacy.id
    }
  }

  return ctx
}

async function applyPlanChangeWithListingOverflow(
  service: ReturnType<typeof getService>,
  userId: string,
  newPlan: MembershipPlan,
  userUpdate: Record<string, unknown>,
): Promise<void> {
  // Clear limit-upsell markers so a future cap on the new plan can trigger once.
  const { error } = await service
    .from('users')
    .update({
      ...userUpdate,
      listing_limit_reached_at: null,
      listing_limit_upsell_sent_at: null,
    })
    .eq('id', userId)

  if (error) {
    throw new Error(`Failed to update user plan: ${error.message}`)
  }

  const overflow = await enforceListingOverflowForUser(service, userId, newPlan)
  if (overflow && overflow.unpublishedCount > 0) {
    dispatchPlanDowngradeListingOverflowEmail({
      sellerEmail: overflow.email,
      userId: overflow.userId,
      newPlanLabel: overflow.newPlanLabel,
      unpublishedCount: overflow.unpublishedCount,
      keptActiveCount: overflow.keptActiveCount,
    })
  }
}

async function resolveIndividualUserId(
  service: ReturnType<typeof getService>,
  opts: { userId?: string; customerId?: string | null },
): Promise<string | null> {
  if (opts.userId) return opts.userId
  if (!opts.customerId) return null

  const { data: dbUser } = await service
    .from('users')
    .select('id')
    .eq('stripe_customer_id', opts.customerId)
    .maybeSingle()

  return dbUser?.id ?? null
}

async function getUserPlan(
  service: ReturnType<typeof getService>,
  userId: string,
): Promise<MembershipPlan> {
  const { data } = await service
    .from('users')
    .select('plan')
    .eq('id', userId)
    .maybeSingle()

  return (data?.plan ?? 'free') as MembershipPlan
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const sig = req.headers.get('stripe-signature') ?? ''
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? ''

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (err) {
    console.error('[stripe/webhook] signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const service = getService()

  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        // Enterprise initial subscription (Checkout subscription mode)
        if (
          session.mode === 'subscription' &&
          session.metadata?.setup_type === 'enterprise_subscription'
        ) {
          await handleEnterpriseCheckoutSubscriptionCompleted(service, session)
          break
        }

        // Legacy Enterprise payment method setup (setup mode — pre-Checkout migration)
        if (
          session.mode === 'setup' &&
          session.metadata?.setup_type === 'enterprise_payment_method'
        ) {
          await handleEnterpriseCheckoutSetupCompleted(service, session)
          break
        }

        // Individual membership checkout — unchanged scoping
        if (session.mode !== 'subscription') {
          break
        }

        const sub = await stripe.subscriptions.retrieve(session.subscription as string)

        if (isEnterpriseSubscriptionMetadata(sub.metadata)) {
          console.log('[webhook] enterprise subscription checkout — skipping user plan update')
          break
        }

        const item = sub.items.data[0]
        const priceId = item.price.id

        if (isEnterprisePriceId(priceId)) {
          console.log('[webhook] enterprise price on subscription — skipping user plan update')
          break
        }

        const plan = tierFromPriceId(priceId)
        const period = billingPeriodFromInterval(item.price.recurring?.interval)
        const userId = await resolveIndividualUserId(service, {
          userId: sub.metadata?.supabase_user_id ?? session.metadata?.supabase_user_id,
          customerId: typeof session.customer === 'string' ? session.customer : session.customer?.id,
        })

        if (!userId) break

        const previousPlan = await getUserPlan(service, userId)

        const userUpdate = {
          plan,
          stripe_subscription_id: sub.id,
          stripe_price_id: priceId,
          billing_period: period,
        }

        await applyPlanChangeWithListingOverflow(service, userId, plan, userUpdate)

        await dispatchSubscriptionConfirmedIfUpgrade({
          service,
          userId,
          previousPlan,
          newPlan: plan,
          billingPeriod: period,
        })
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription

        if (
          isEnterpriseSubscriptionMetadata(sub.metadata) ||
          await isOrganizationSubscription(service, sub.id)
        ) {
          console.log('[webhook] enterprise subscription updated — skipping user plan update')
          break
        }

        const item = sub.items.data[0]
        if (isEnterprisePriceId(item.price.id)) break

        const plan = tierFromPriceId(item.price.id)
        const period = billingPeriodFromInterval(item.price.recurring?.interval)

        const { data: dbUser } = await service
          .from('users')
          .select('id')
          .eq('stripe_subscription_id', sub.id)
          .maybeSingle()

        if (!dbUser) break

        await applyPlanChangeWithListingOverflow(service, dbUser.id, plan, {
          plan,
          stripe_price_id: item.price.id,
          billing_period: period,
        })
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription

        if (
          isEnterpriseSubscriptionMetadata(sub.metadata) ||
          await isOrganizationSubscription(service, sub.id)
        ) {
          console.log('[webhook] enterprise subscription deleted:', sub.id)
          break
        }

        const { data: dbUser } = await service
          .from('users')
          .select('id')
          .eq('stripe_subscription_id', sub.id)
          .maybeSingle()

        if (!dbUser) break

        await applyPlanChangeWithListingOverflow(service, dbUser.id, 'free', {
          plan: 'free',
          stripe_subscription_id: null,
          stripe_price_id: null,
          billing_period: null,
        })
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        // Enterprise only (early-returns when invoice is not an org subscription)
        await handleEnterpriseInvoicePaymentSucceeded(service, invoice)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        // Enterprise path first — no-ops for individual invoices
        await handleEnterpriseInvoicePaymentFailed(service, invoice)
        // Parallel individual-tier path — no-ops for Enterprise org invoices
        await handleIndividualInvoicePaymentFailed(service, invoice)
        break
      }

      case 'invoice.upcoming': {
        const invoice = event.data.object as Stripe.Invoice
        // Individual tiers only — skips Enterprise org / enterprise-priced subscriptions
        await handleIndividualInvoiceUpcoming(service, invoice)
        break
      }

      default:
        break
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const stack = err instanceof Error ? err.stack : undefined
    console.error('[stripe/webhook] handler failed', {
      ...webhookErrorContext(event),
      message,
      stack,
      err,
    })
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
