import { NextRequest, NextResponse } from 'next/server'
import {
  LISTING_VERIFIER_AGENT_NAME,
  publishListingFromVerificationApprove,
} from '@/lib/agents/listingVerificationPublish'
import {
  acceptPendingFlagRecommendation,
  flagListingForNeedsChanges,
  updateVerificationLogOutcome,
} from '@/lib/agents/listingVerificationFlag'
import { requireAdminApi } from '@/lib/rigburrito/auth'
import { createServiceClient } from '@/lib/rigburrito/service'

const AGENT_NAME = LISTING_VERIFIER_AGENT_NAME

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const body = await req.json()
    const { recommendation_id, action, flag_comment } = body as {
      recommendation_id?: string
      action?: 'accept' | 'override'
      flag_comment?: string
    }

    if (!recommendation_id || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['accept', 'override'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const service = createServiceClient()

    const { data: recommendation, error: recError } = await service
      .from('agent_recommendations')
      .select('*')
      .eq('id', recommendation_id)
      .single()

    if (recError || !recommendation) {
      return NextResponse.json({ error: 'Recommendation not found' }, { status: 404 })
    }

    if (recommendation.status !== 'pending') {
      return NextResponse.json({ error: 'Recommendation already processed' }, { status: 400 })
    }

    const listingId = recommendation.entity_id as string

    if (action === 'accept') {
      if (recommendation.recommended_action === 'approve') {
        const publishResult = await publishListingFromVerificationApprove(service, listingId, {
          recommendationId: recommendation_id,
        })
        if (!publishResult.ok) {
          return NextResponse.json({ error: publishResult.error }, { status: publishResult.status })
        }

        await updateVerificationLogOutcome(service, listingId, 'approved')

        return NextResponse.json({ success: true })
      }

      if (recommendation.recommended_action === 'flag') {
        const comment = (recommendation.flag_comment as string | null)?.trim() ?? ''
        const flagResult = await acceptPendingFlagRecommendation(service, {
          recommendationId: recommendation_id,
          listingId,
          flagComment: comment,
          adminId: auth.userId,
        })
        if (!flagResult.ok) {
          return NextResponse.json({ error: flagResult.error }, { status: flagResult.status })
        }

        return NextResponse.json({ success: true })
      }

      return NextResponse.json({ error: 'Unsupported recommendation action' }, { status: 400 })
    }

    const comment = flag_comment?.trim()
    if (!comment || comment.length < 20) {
      return NextResponse.json({ error: 'Flag comment must be at least 20 characters' }, { status: 400 })
    }

    const flagResult = await flagListingForNeedsChanges(service, listingId, comment, {
      adminId: auth.userId,
    })
    if (!flagResult.ok) {
      return NextResponse.json({ error: flagResult.error }, { status: flagResult.status })
    }

    const { error: recUpdateError } = await service
      .from('agent_recommendations')
      .update({ status: 'overridden', updated_at: new Date().toISOString() })
      .eq('id', recommendation_id)

    if (recUpdateError) {
      return NextResponse.json({ error: recUpdateError.message }, { status: 500 })
    }

    await service.from('agent_activity_log').insert({
      agent_name: AGENT_NAME,
      action: 'verification_override',
      entity_type: 'listing',
      entity_id: listingId,
      outcome: 'overridden',
      summary: `Admin overrode agent recommendation for listing ${listingId}`,
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
