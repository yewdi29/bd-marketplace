#!/usr/bin/env node
/**
 * Replay handleEnterpriseCheckoutSubscriptionCompleted for a stuck org.
 * Uses .env.local — does NOT hand-edit Supabase rows.
 *
 * Usage:
 *   node scripts/replay-enterprise-checkout-webhook.mjs <organization_id>
 */
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

function loadEnvLocal() {
  try {
    const raw = readFileSync(resolve(root, '.env.local'), 'utf8')
    for (const line of raw.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      let val = trimmed.slice(eq + 1).trim()
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      if (!process.env[key]) process.env[key] = val
    }
  } catch {
    console.warn('Could not read .env.local — relying on existing process.env')
  }
}

loadEnvLocal()

const orgId = process.argv[2]
if (!orgId) {
  console.error('Usage: node scripts/replay-enterprise-checkout-webhook.mjs <organization_id>')
  process.exit(1)
}

const stripeKey = process.env.STRIPE_SECRET_KEY
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!stripeKey || !supabaseUrl || !serviceKey) {
  console.error('Missing STRIPE_SECRET_KEY, NEXT_PUBLIC_SUPABASE_URL, or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const stripe = new Stripe(stripeKey, { apiVersion: '2026-05-27.dahlia' })
const supabase = createClient(supabaseUrl, serviceKey)

async function main() {
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id, name, stripe_customer_id, stripe_subscription_id, preferred_payment_method')
    .eq('id', orgId)
    .single()

  if (orgError || !org) {
    console.error('Organization not found:', orgError?.message)
    process.exit(1)
  }

  console.log('Org:', org.name, org.id)
  console.log('Current DB:', {
    stripe_customer_id: org.stripe_customer_id,
    stripe_subscription_id: org.stripe_subscription_id,
    preferred_payment_method: org.preferred_payment_method,
  })

  if (!org.stripe_customer_id) {
    console.error('No stripe_customer_id on org — cannot locate Checkout session')
    process.exit(1)
  }

  const sessions = await stripe.checkout.sessions.list({
    customer: org.stripe_customer_id,
    limit: 20,
  })

  const match = sessions.data.find(
    s =>
      s.status === 'complete' &&
      s.metadata?.organization_id === orgId &&
      s.metadata?.setup_type === 'enterprise_subscription',
  )

  if (!match) {
    console.error('No completed enterprise_subscription Checkout session found for this org')
    process.exit(1)
  }

  const session = await stripe.checkout.sessions.retrieve(match.id)
  console.log('\nCheckout session:', session.id)
  console.log('Subscription:', session.subscription)
  console.log('Metadata:', session.metadata)

  const events = await stripe.events.list({
    type: 'checkout.session.completed',
    limit: 100,
  })

  const relatedEvent = events.data.find(
    e => (e.data.object).id === session.id,
  )

  if (relatedEvent) {
    console.log('\nStripe event to resend from Dashboard:', relatedEvent.id)
    console.log('Developers → Events →', relatedEvent.id, '→ Resend')
  }

  // Dynamic import of compiled handler is unavailable — invoke via local API if running,
  // otherwise instruct deploy + resend.
  console.log('\nTo replay handler locally after deploying the fix, resend event', relatedEvent?.id ?? '(find in Stripe Events)')
  console.log('Or run this app locally and POST the webhook with stripe listen + trigger.')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
