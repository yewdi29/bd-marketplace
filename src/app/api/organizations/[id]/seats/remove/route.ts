import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { requireOrgBillingAccess } from '@/lib/organizations/auth'
import {
  confirmRemoveSeat,
  previewRemoveSeat,
} from '@/lib/stripe/enterpriseSubscription'

function getService() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

/**
 * POST /api/organizations/[id]/seats/remove
 * Body: { mode: 'preview' | 'confirm' }
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
    const body = await req.json() as { mode?: string }
    const mode = body.mode ?? 'preview'

    if (mode !== 'preview' && mode !== 'confirm') {
      return NextResponse.json(
        { error: 'mode must be "preview" or "confirm"' },
        { status: 400 },
      )
    }

    const service = getService()

    if (mode === 'preview') {
      const preview = await previewRemoveSeat(service, params.id)
      return NextResponse.json({ success: true, preview })
    }

    const result = await confirmRemoveSeat(service, params.id)
    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    console.error('[organizations/seats/remove]', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
