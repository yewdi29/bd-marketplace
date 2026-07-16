-- Reconcile users whose DB plan may be out of sync with Stripe after webhook 308 failures.
-- Run in Supabase SQL Editor (read-only audit). Compare results against Stripe Dashboard.
--
-- Webhook endpoint was registered on apex (blackdiamondmkt.com) while Vercel primary
-- domain was www — all POSTs received 308 and were never processed since ~June 2026.

-- Users with a Stripe subscription id but plan still "free" (likely missed checkout.session.completed)
SELECT id, email, plan, stripe_subscription_id, stripe_price_id, billing_period, updated_at
FROM users
WHERE stripe_subscription_id IS NOT NULL
  AND plan = 'free'
ORDER BY updated_at DESC;

-- Paying-tier users missing subscription id (checkout may have succeeded in Stripe only)
SELECT id, email, plan, stripe_customer_id, stripe_subscription_id, updated_at
FROM users
WHERE plan IN ('starter', 'pro', 'max')
  AND stripe_subscription_id IS NULL
ORDER BY updated_at DESC;

-- Organizations with Stripe subscription but billing fields incomplete
SELECT id, name, stripe_subscription_id, stripe_customer_id, preferred_payment_method, base_seat_count, updated_at
FROM organizations
WHERE stripe_subscription_id IS NOT NULL
  AND (preferred_payment_method IS NULL OR stripe_customer_id IS NULL)
ORDER BY updated_at DESC;

-- All rows with any Stripe billing linkage (manual Stripe API spot-check sample)
SELECT
  'user' AS entity_type,
  id::text AS entity_id,
  email AS label,
  plan::text AS plan_or_status,
  stripe_subscription_id,
  updated_at
FROM users
WHERE stripe_subscription_id IS NOT NULL
   OR stripe_customer_id IS NOT NULL
UNION ALL
SELECT
  'organization',
  id::text,
  name,
  preferred_payment_method::text,
  stripe_subscription_id,
  updated_at
FROM organizations
WHERE stripe_subscription_id IS NOT NULL
   OR stripe_customer_id IS NOT NULL
ORDER BY updated_at DESC;
