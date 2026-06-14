import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Next.js App Router reads raw body via req.text() — no bodyParser config needed
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-05-27.dahlia',
})

// ─── Service-role Supabase client ─────────────────────────────────────────────

function getService() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

// ─── Tier resolver ─────────────────────────────────────────────────────────────
// Matches a Stripe price ID against all six env-var price IDs to determine the
// correct membership plan. Returns 'free' if no match (defensive fallback).

import type { MembershipPlan } from '@/lib/types/database'

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

// ─── Webhook handler ──────────────────────────────────────────────────────────

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

      // ── checkout.session.completed ─────────────────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        console.log('[webhook] checkout.session.completed — full session:', JSON.stringify(session, null, 2))

        if (session.mode !== 'subscription') {
          console.log('[webhook] session.mode is not subscription, skipping:', session.mode)
          break
        }

        // Retrieve the subscription — userId lives in its metadata (set at checkout creation)
        const sub = await stripe.subscriptions.retrieve(session.subscription as string)
        const item = sub.items.data[0]

        const priceId = item.price.id
        console.log('[webhook] extracted price ID from subscription item:', priceId)

        const plan = tierFromPriceId(priceId)
        console.log('[webhook] tier/plan resolved from price ID:', plan, '— env var map:', {
          STRIPE_STARTER_MONTHLY_PRICE_ID: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID,
          STRIPE_STARTER_ANNUAL_PRICE_ID:  process.env.STRIPE_STARTER_ANNUAL_PRICE_ID,
          STRIPE_PRO_MONTHLY_PRICE_ID:     process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
          STRIPE_PRO_ANNUAL_PRICE_ID:      process.env.STRIPE_PRO_ANNUAL_PRICE_ID,
          STRIPE_MAX_MONTHLY_PRICE_ID:     process.env.STRIPE_MAX_MONTHLY_PRICE_ID,
          STRIPE_MAX_ANNUAL_PRICE_ID:      process.env.STRIPE_MAX_ANNUAL_PRICE_ID,
        })

        const period = billingPeriodFromInterval(item.price.recurring?.interval)

        const userId: string | undefined =
          sub.metadata?.supabase_user_id ?? session.metadata?.supabase_user_id

        console.log('[webhook] supabase_user_id from metadata:', userId ?? '(not found — will fall back to stripe_customer_id lookup)')
        console.log('[webhook] stripe_customer_id on session:', session.customer)

        if (userId) {
          const updatePayload = {
            plan,
            stripe_subscription_id: sub.id,
            stripe_price_id: priceId,
            billing_period: period,
          }
          console.log('[webhook] writing to users table by user ID:', userId, '— payload:', updatePayload)

          const { data: updateData, error: updateError } = await service
            .from('users')
            .update(updatePayload)
            .eq('id', userId)
            .select()

          console.log('[webhook] Supabase update result — data:', updateData, '— error:', updateError)
        } else {
          // Fallback: look up by Stripe customer ID
          const customerId = session.customer as string
          console.log('[webhook] falling back to stripe_customer_id lookup:', customerId)

          const { data: dbUser, error: lookupError } = await service
            .from('users')
            .select('id')
            .eq('stripe_customer_id', customerId)
            .single()

          console.log('[webhook] Supabase user lookup result — found:', dbUser ? `user id ${dbUser.id}` : 'no user found', '— error:', lookupError)

          if (dbUser) {
            const updatePayload = {
              plan,
              stripe_subscription_id: sub.id,
              stripe_price_id: priceId,
              billing_period: period,
            }
            console.log('[webhook] writing to users table by stripe_customer_id:', customerId, '— payload:', updatePayload)

            const { data: updateData, error: updateError } = await service
              .from('users')
              .update(updatePayload)
              .eq('id', dbUser.id)
              .select()

            console.log('[webhook] Supabase update result — data:', updateData, '— error:', updateError)
          } else {
            console.log('[webhook] ERROR: could not find user for stripe_customer_id:', customerId, '— no update performed')
          }
        }
        break
      }

      // ── customer.subscription.updated ─────────────────────────────────────
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const item = sub.items.data[0]
        const plan = tierFromPriceId(item.price.id)
        const period = billingPeriodFromInterval(item.price.recurring?.interval)

        await service.from('users').update({
          plan,
          stripe_price_id: item.price.id,
          billing_period: period,
        }).eq('stripe_subscription_id', sub.id)
        break
      }

      // ── customer.subscription.deleted ─────────────────────────────────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription

        await service.from('users').update({
          plan: 'free',
          stripe_subscription_id: null,
          stripe_price_id: null,
          billing_period: null,
        }).eq('stripe_subscription_id', sub.id)
        break
      }

      default:
        // Unhandled event type — ignore
        break
    }
  } catch (err) {
    console.error(`[stripe/webhook] error handling ${event.type}:`, err)
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
