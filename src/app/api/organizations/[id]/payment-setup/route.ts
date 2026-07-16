import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { requireOrgBillingAccess } from '@/lib/organizations/auth'
import {
  createOrganizationPaymentSetupSession,
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
 * Creates a Stripe Checkout Session (setup mode).
 * Monthly orgs: card + ACH. Annual orgs: ACH-only (same rule as Max-tier annual).
 * Returns { url } for redirect.
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

    const body = await req.json().catch(() => ({})) as { returnUrl?: string }
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const returnUrl = body.returnUrl ?? `${appUrl}/dashboard/settings`

    const url = await createOrganizationPaymentSetupSession(org, returnUrl)

    return NextResponse.json({ success: true, url })
  } catch (err) {
    console.error('[organizations/payment-setup]', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
