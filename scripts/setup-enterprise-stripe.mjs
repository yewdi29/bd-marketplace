#!/usr/bin/env node
/**
 * One-time setup: create Stripe Enterprise product + four recurring prices.
 *
 * Usage:
 *   STRIPE_SECRET_KEY=sk_... node scripts/setup-enterprise-stripe.mjs
 *
 * Optional overrides (amounts in cents):
 *   ENTERPRISE_BASE_MONTHLY_CENTS=149900
 *   ENTERPRISE_PER_SEAT_MONTHLY_CENTS=9900
 *   ENTERPRISE_BASE_ANNUAL_CENTS=1499000
 *   ENTERPRISE_PER_SEAT_ANNUAL_CENTS=99000
 *
 * Idempotency: matches on product metadata + price metadata (component + interval)
 * AND unit_amount. If an active price exists at the wrong amount, a NEW price is
 * created and the stale one is flagged for manual archiving in Stripe dashboard.
 *
 * Add the printed price IDs to .env.local.
 */

import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2026-05-27.dahlia',
})

const PRICES = [
  {
    envKey: 'STRIPE_ENTERPRISE_BASE_MONTHLY_PRICE_ID',
    centsEnv: 'ENTERPRISE_BASE_MONTHLY_CENTS',
    defaultCents: 149900,
    component: 'base',
    interval: 'month',
    label: 'Enterprise base (monthly, 5 seats included)',
  },
  {
    envKey: 'STRIPE_ENTERPRISE_BASE_ANNUAL_PRICE_ID',
    centsEnv: 'ENTERPRISE_BASE_ANNUAL_CENTS',
    defaultCents: 1499000,
    component: 'base',
    interval: 'year',
    label: 'Enterprise base (annual, 5 seats included)',
  },
  {
    envKey: 'STRIPE_ENTERPRISE_PER_SEAT_MONTHLY_PRICE_ID',
    centsEnv: 'ENTERPRISE_PER_SEAT_MONTHLY_CENTS',
    defaultCents: 9900,
    component: 'per_seat',
    interval: 'month',
    label: 'Enterprise additional seat (monthly)',
  },
  {
    envKey: 'STRIPE_ENTERPRISE_PER_SEAT_ANNUAL_PRICE_ID',
    centsEnv: 'ENTERPRISE_PER_SEAT_ANNUAL_CENTS',
    defaultCents: 99000,
    component: 'per_seat',
    interval: 'year',
    label: 'Enterprise additional seat (annual)',
  },
]

const PRODUCT_LOOKUP_KEY = 'bd_enterprise_base'

function formatAmount(cents, interval) {
  const dollars = (cents / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return interval === 'year' ? `$${dollars}/yr` : `$${dollars}/mo`
}

function findExactPrice(prices, component, interval, unitAmount) {
  return prices.find(
    p =>
      p.active &&
      p.metadata?.component === component &&
      p.recurring?.interval === interval &&
      p.unit_amount === unitAmount,
  )
}

function findStalePrices(prices, component, interval, unitAmount) {
  return prices.filter(
    p =>
      p.active &&
      p.metadata?.component === component &&
      p.recurring?.interval === interval &&
      p.unit_amount !== unitAmount,
  )
}

async function ensurePrice(product, allPrices, spec) {
  const unitAmount = Number(process.env[spec.centsEnv] ?? spec.defaultCents)

  const exact = findExactPrice(allPrices, spec.component, spec.interval, unitAmount)
  if (exact) {
    console.log(`Using existing ${spec.label}:`, exact.id, formatAmount(unitAmount, spec.interval))
    return exact
  }

  const stale = findStalePrices(allPrices, spec.component, spec.interval, unitAmount)
  for (const old of stale) {
    console.warn(
      `⚠ Stale price ${old.id} (${spec.component}/${spec.interval}) at ${formatAmount(old.unit_amount, spec.interval)} — archive this in Stripe dashboard after updating env vars.`,
    )
  }

  const metadata = { component: spec.component }
  if (spec.component === 'base') {
    metadata.included_seats = '5'
  }

  const created = await stripe.prices.create({
    product: product.id,
    unit_amount: unitAmount,
    currency: 'usd',
    recurring: { interval: spec.interval },
    metadata,
  })

  console.log(`Created ${spec.label}:`, created.id, formatAmount(unitAmount, spec.interval))
  return created
}

async function main() {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY is required')
    process.exit(1)
  }

  let product
  const existing = await stripe.products.search({
    query: `active:'true' AND metadata['lookup_key']:'${PRODUCT_LOOKUP_KEY}'`,
    limit: 1,
  })

  if (existing.data[0]) {
    product = existing.data[0]
    console.log('Using existing product:', product.id, product.name)
  } else {
    product = await stripe.products.create({
      name: 'Black Diamond Enterprise',
      description: 'Enterprise team plan — includes 5 seats; additional seats billed separately',
      metadata: { lookup_key: PRODUCT_LOOKUP_KEY, plan_type: 'enterprise' },
    })
    console.log('Created product:', product.id)
  }

  const listed = await stripe.prices.list({ product: product.id, active: true, limit: 100 })
  const results = {}

  for (const spec of PRICES) {
    const price = await ensurePrice(product, listed.data, spec)
    results[spec.envKey] = price.id
  }

  console.log('\nAdd to .env.local:\n')
  for (const spec of PRICES) {
    console.log(`${spec.envKey}=${results[spec.envKey]}`)
  }
  console.log('\nOptional amount overrides (cents):')
  for (const spec of PRICES) {
    console.log(`# ${spec.centsEnv}=${process.env[spec.centsEnv] ?? spec.defaultCents}`)
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
