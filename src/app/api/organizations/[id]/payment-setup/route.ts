import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { requireOrgBillingAccess } from '@/lib/organizations/auth'
import { ENTERPRISE_TERMS_VERSION } from '@/lib/organizations/enterpriseTerms'
import type { EnterpriseBillingInterval } from '@/lib/stripe/enterpriseConfig'
import {
  createOrganizationCheckoutSession,
  getOrganizationById,
} from '@/lib/stripe/enterpriseSubscription'

function getService() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

/**
 * POST /api/organizations/[id]/payment-setup
 * Creates a Stripe Checkout Session (subscription mode) for initial Enterprise billing.
 * Terms acceptance is collected on Stripe Checkout via consent_collection.terms_of_service.
 * Returns { url } for redirect — generated fresh each call.
 *
 * Requires Stripe Dashboard → Settings → Business → Public details → Terms of service URL
 * when consent_collection.terms_of_service is enabled.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireOrgBillingAccess(params.id)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const service = getService()
    const org = await getOrganizationById(service, params.id)

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const body = await req.json().catch(() => ({})) as {
      returnUrl?: string
      couponId?: string
      promotionCodeId?: string
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const returnUrl = body.returnUrl ?? `${appUrl}/dashboard/organization?tab=billing`

    const billingInterval: EnterpriseBillingInterval =
      org.billing_interval === 'annual' ? 'annual' : 'monthly'

    const url = await createOrganizationCheckoutSession(org, {
      returnUrl,
      billingInterval,
      termsVersion: ENTERPRISE_TERMS_VERSION,
      couponId: body.couponId,
      promotionCodeId: body.promotionCodeId,
    })

    return NextResponse.json({ success: true, url })
  } catch (err) {
    console.error('[organizations/payment-setup]', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
