import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import type { MembershipPlan } from '@/lib/types/database'
import { dispatchPlanDowngradeListingOverflowEmail } from '@/lib/email/transactionalEmails'
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

async function applyPlanChangeWithListingOverflow(
  service: ReturnType<typeof getService>,
  userId: string,
  newPlan: MembershipPlan,
  userUpdate: Record<string, unknown>,
): Promise<void> {
  const { error } = await service
    .from('users')
    .update(userUpdate)
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

        // Individual membership checkout — unchanged
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
        const userId: string | undefined =
          sub.metadata?.supabase_user_id ?? session.metadata?.supabase_user_id

        const userUpdate = {
          plan,
          stripe_subscription_id: sub.id,
          stripe_price_id: priceId,
          billing_period: period,
        }

        if (userId) {
          await applyPlanChangeWithListingOverflow(service, userId, plan, userUpdate)
        } else {
          const customerId = session.customer as string
          const { data: dbUser } = await service
            .from('users')
            .select('id')
            .eq('stripe_customer_id', customerId)
            .single()

          if (dbUser) {
            await applyPlanChangeWithListingOverflow(service, dbUser.id, plan, userUpdate)
          }
        }
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
        await handleEnterpriseInvoicePaymentSucceeded(service, invoice)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handleEnterpriseInvoicePaymentFailed(service, invoice)
        break
      }

      default:
        break
    }
  } catch (err) {
    console.error(`[stripe/webhook] error handling ${event.type}:`, err)
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
