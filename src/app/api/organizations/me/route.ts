import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getActiveOrgMembership } from '@/lib/organizations/auth'
import { getOrgBillingGateState } from '@/lib/organizations/billingGate'
import { getEnterpriseBillingInterval } from '@/lib/stripe/enterpriseSubscription'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const membership = await getActiveOrgMembership(user.id)
  if (!membership) {
    return NextResponse.json({
      success: true,
      membership: null,
      organization: null,
      billingDisplay: null,
      billingGate: null,
    })
  }

  const billingGate = await getOrgBillingGateState(supabase, user.id)

  const { data: organization, error } = await supabase
    .from('organizations')
    .select('id, name, logo_url, description, base_seat_count, preferred_payment_method, stripe_customer_id, stripe_subscription_id, last_billing_failure_at, last_billing_failure_message')
    .eq('id', membership.organization_id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let billingInterval: 'monthly' | 'annual' | null = null
  if (organization?.stripe_subscription_id) {
    try {
      billingInterval = await getEnterpriseBillingInterval(organization.stripe_subscription_id)
    } catch {
      billingInterval = null
    }
  }

  return NextResponse.json({
    success: true,
    membership,
    organization,
    billingDisplay: {
      planName: 'Enterprise',
      billingInterval,
    },
    billingGate,
  })
}
