import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { requireOrgBillingAccess } from '@/lib/organizations/auth'
import {
  countActiveOrgMembers,
  getEnterpriseBillingInterval,
  getOrganizationById,
  getSubscriptionItemIds,
  reconcileOrganizationSeats,
} from '@/lib/stripe/enterpriseSubscription'

function getService() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireOrgBillingAccess(params.id)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const service = getService()
  const org = await getOrganizationById(service, params.id)
  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
  }

  const { data: orgRow } = await service
    .from('organizations')
    .select('last_billing_failure_at, last_billing_failure_message')
    .eq('id', params.id)
    .single()

  const activeCount = await countActiveOrgMembers(service, params.id)

  const { count: invitedCount } = await service
    .from('org_members')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', params.id)
    .eq('status', 'invited')

  let billingInterval: 'monthly' | 'annual' | null = null
  let additionalSeatsBilled = 0
  let reconciliation = null

  if (org.stripe_subscription_id) {
    billingInterval = await getEnterpriseBillingInterval(org.stripe_subscription_id)
    const items = await getSubscriptionItemIds(org.stripe_subscription_id)
    additionalSeatsBilled = items.perSeatQuantity
    reconciliation = await reconcileOrganizationSeats(service, params.id)
  }

  const seatsInUse = activeCount + (invitedCount ?? 0)

  return NextResponse.json({
    success: true,
    billing: {
      planName: 'Enterprise',
      billingInterval,
      baseSeatCount: org.base_seat_count,
      activeMemberCount: activeCount,
      invitedMemberCount: invitedCount ?? 0,
      seatsInUse,
      additionalSeatsBilled,
      preferredPaymentMethod: org.preferred_payment_method,
      hasPaymentMethod: Boolean(org.preferred_payment_method),
      hasSubscription: Boolean(org.stripe_subscription_id),
      lastBillingFailureAt: orgRow?.last_billing_failure_at ?? null,
      lastBillingFailureMessage: orgRow?.last_billing_failure_message ?? null,
      reconciliation,
    },
  })
}
