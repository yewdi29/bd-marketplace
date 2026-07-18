import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { requireAdminApi } from '@/lib/rigburrito/auth'
import { createOrganizationStripeCustomer } from '@/lib/stripe/enterpriseSubscription'

function getService() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

/**
 * POST /api/organizations/subscription/create
 * Creates a Stripe Customer for an organization (no subscription — that happens at Checkout).
 *
 * Body: {
 *   organizationId: string
 *   primaryOwnerEmail: string
 *   billingInterval?: 'monthly' | 'annual'
 * }
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdminApi()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const body = await req.json() as {
      organizationId?: string
      primaryOwnerEmail?: string
      billingInterval?: 'monthly' | 'annual'
    }

    if (!body.organizationId || !body.primaryOwnerEmail) {
      return NextResponse.json(
        { error: 'organizationId and primaryOwnerEmail are required' },
        { status: 400 },
      )
    }

    const billingInterval = body.billingInterval === 'annual' ? 'annual' : 'monthly'

    const service = getService()
    const result = await createOrganizationStripeCustomer(
      service,
      body.organizationId,
      body.primaryOwnerEmail,
      billingInterval,
    )

    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    console.error('[organizations/subscription/create]', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
