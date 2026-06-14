import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-05-27.dahlia',
})

// ─── Price ID map ─────────────────────────────────────────────────────────────
// Maps tier id + billing period → Stripe price ID (read from env, never hardcoded)

function getPriceId(tierId: string, billingPeriod: string): string | null {
  const key = `${tierId}_${billingPeriod}`.toUpperCase()
  const map: Record<string, string | undefined> = {
    STARTER_MONTHLY: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID,
    STARTER_ANNUAL:  process.env.STRIPE_STARTER_ANNUAL_PRICE_ID,
    PRO_MONTHLY:     process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
    PRO_ANNUAL:      process.env.STRIPE_PRO_ANNUAL_PRICE_ID,
    MAX_MONTHLY:     process.env.STRIPE_MAX_MONTHLY_PRICE_ID,
    MAX_ANNUAL:      process.env.STRIPE_MAX_ANNUAL_PRICE_ID,
  }
  return map[key] ?? null
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { tierId: string; billingPeriod: string }
    const { tierId, billingPeriod } = body

    if (!tierId || !billingPeriod) {
      return NextResponse.json({ error: 'Missing tierId or billingPeriod' }, { status: 400 })
    }

    const priceId = getPriceId(tierId, billingPeriod)
    if (!priceId) {
      return NextResponse.json({ error: 'Invalid tier or billing period' }, { status: 400 })
    }

    // ── Auth: get current user ─────────────────────────────────────────────────
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ── Service-role client for writes ─────────────────────────────────────────
    const service = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    // ── Look up or create Stripe customer ──────────────────────────────────────
    const { data: userData } = await service
      .from('users')
      .select('stripe_customer_id, email, full_name')
      .eq('id', user.id)
      .single()

    let customerId: string = userData?.stripe_customer_id ?? ''

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userData?.email ?? user.email ?? '',
        name:  userData?.full_name ?? undefined,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id

      await service
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    // ── Create Checkout session ────────────────────────────────────────────────
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard?upgrade=success`,
      cancel_url:  `${appUrl}/dashboard`,
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          tier_id: tierId,
          billing_period: billingPeriod,
        },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[stripe/checkout]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
