import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdminApi } from '@/lib/rigburrito/auth'
import { createOrganizationStripeCustomer } from '@/lib/stripe/enterpriseSubscription'
import { createPrimaryOwnerInvite } from '@/lib/organizations/createPrimaryOwnerInvite'
import { parseEnterpriseMetadata } from '@/lib/organizations/enterpriseDealMetadata'

function getService() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

/**
 * POST /api/rigburrito/deals/[id]/close-enterprise
 * Admin-only terminal action for enterprise deals.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminApi()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await params
  const body = await req.json() as {
    organizationName?: string
    primaryOwnerEmail?: string
    billingInterval?: 'monthly' | 'annual'
  }

  const organizationName = body.organizationName?.trim()
  const primaryOwnerEmail = body.primaryOwnerEmail?.trim().toLowerCase()
  const billingInterval = body.billingInterval === 'annual' ? 'annual' : 'monthly'

  if (!organizationName || !primaryOwnerEmail) {
    return NextResponse.json(
      { error: 'Organization name and primary owner email are required' },
      { status: 400 },
    )
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(primaryOwnerEmail)) {
    return NextResponse.json({ error: 'Enter a valid primary owner email' }, { status: 400 })
  }

  const service = getService()

  const { data: deal, error: dealError } = await service
    .from('deals')
    .select('id, deal_type, status, organization_id, enterprise_metadata')
    .eq('id', id)
    .single()

  if (dealError || !deal) {
    return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
  }

  if (deal.deal_type !== 'enterprise') {
    return NextResponse.json({ error: 'This action is only for enterprise deals' }, { status: 400 })
  }

  if (deal.status === 'closed_won' || deal.status === 'closed_lost') {
    return NextResponse.json({ error: 'Deal is already closed' }, { status: 400 })
  }

  if (deal.organization_id) {
    return NextResponse.json({ error: 'Deal is already linked to an organization' }, { status: 400 })
  }

  const { data: orgRow, error: orgError } = await service
    .from('organizations')
    .insert({ name: organizationName })
    .select('id, name')
    .single()

  if (orgError || !orgRow) {
    return NextResponse.json(
      { error: orgError?.message ?? 'Failed to create organization' },
      { status: 500 },
    )
  }

  try {
    await createOrganizationStripeCustomer(
      service,
      orgRow.id,
      primaryOwnerEmail,
      billingInterval,
    )
  } catch (err) {
    await service.from('organizations').delete().eq('id', orgRow.id)
    const message = err instanceof Error ? err.message : 'Stripe customer creation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }

  try {
    await createPrimaryOwnerInvite(service, {
      organizationId: orgRow.id,
      organizationName: orgRow.name,
      primaryOwnerEmail,
    })
  } catch (err) {
    console.error('[close-enterprise] invite failed after Stripe setup — org exists:', orgRow.id, err)
    const message = err instanceof Error ? err.message : 'Failed to create primary owner invite'
    return NextResponse.json(
      {
        error: `${message}. Organization and Stripe customer were created (id: ${orgRow.id}) but the owner invite was not sent — retry manually.`,
        organizationId: orgRow.id,
      },
      { status: 500 },
    )
  }

  const { error: updateError } = await service
    .from('deals')
    .update({
      status: 'closed_won',
      organization_id: orgRow.id,
    })
    .eq('id', id)

  if (updateError) {
    return NextResponse.json(
      {
        error: `Organization created but deal update failed: ${updateError.message}`,
        organizationId: orgRow.id,
      },
      { status: 500 },
    )
  }

  const metadata = parseEnterpriseMetadata(
    deal.enterprise_metadata as Record<string, unknown> | null,
  )

  return NextResponse.json({
    success: true,
    organizationId: orgRow.id,
    organizationName: orgRow.name,
    primaryOwnerEmail,
    billingInterval,
    companyName: metadata?.company_name ?? organizationName,
  })
}
