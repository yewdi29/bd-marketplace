import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { requireAdminApi } from '@/lib/rigburrito/auth'
import { requireOrgBillingAccess } from '@/lib/organizations/auth'
import { reconcileOrganizationSeats } from '@/lib/stripe/enterpriseSubscription'

function getService() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

/**
 * GET /api/organizations/[id]/seats/reconcile
 * Compares active org_members count vs Stripe per-seat subscription quantity.
 * Callable by org owners or admins (for Phase 5 scheduled jobs, use admin/service).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const ownerAuth = await requireOrgBillingAccess(params.id)
  let authorized = ownerAuth.ok

  if (!authorized) {
    const adminAuth = await requireAdminApi()
    authorized = adminAuth.ok
  }

  if (!authorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const service = getService()
    const result = await reconcileOrganizationSeats(service, params.id)
    return NextResponse.json({ success: true, reconciliation: result })
  } catch (err) {
    console.error('[organizations/seats/reconcile]', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
