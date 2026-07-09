import { NextRequest, NextResponse } from 'next/server'
import { verifyPaperclipSecret } from '@/lib/agents/verifyPaperclipSecret'
import { createServiceClient } from '@/lib/rigburrito/service'

const AGENT_NAME = 'Listing Verifier'

export async function POST(req: NextRequest) {
  const authError = verifyPaperclipSecret(req)
  if (authError) return authError

  try {
    const body = await req.json()
    const {
      listing_id,
      recommended_action,
      confidence_score,
      reasoning,
      flag_comment,
    } = body as {
      listing_id?: string
      recommended_action?: 'approve' | 'flag'
      confidence_score?: number
      reasoning?: string
      flag_comment?: string
    }

    if (!listing_id || !recommended_action || confidence_score == null || !reasoning) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['approve', 'flag'].includes(recommended_action)) {
      return NextResponse.json({ error: 'Invalid recommended_action' }, { status: 400 })
    }

    if (recommended_action === 'flag' && !flag_comment?.trim()) {
      return NextResponse.json({ error: 'flag_comment is required when recommending flag' }, { status: 400 })
    }

    const service = createServiceClient()

    const { data: listing, error: listingError } = await service
      .from('listings')
      .select('id, title')
      .eq('id', listing_id)
      .single()

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    const { data: recommendation, error: recError } = await service
      .from('agent_recommendations')
      .insert({
        agent_name: AGENT_NAME,
        entity_type: 'listing',
        entity_id: listing_id,
        recommended_action,
        confidence_score,
        reasoning,
        flag_comment: flag_comment?.trim() ?? null,
        status: 'pending',
      })
      .select('id')
      .single()

    if (recError || !recommendation) {
      return NextResponse.json({ error: recError?.message ?? 'Failed to save recommendation' }, { status: 500 })
    }

    const actionLabel = recommended_action.toUpperCase()
    const summary = `Recommended ${actionLabel} for ${listing.title} (confidence: ${confidence_score}%)`

    const { error: logError } = await service.from('agent_activity_log').insert({
      agent_name: AGENT_NAME,
      action: 'verification_complete',
      entity_type: 'listing',
      entity_id: listing_id,
      outcome: 'pending_review',
      summary,
    })

    if (logError) {
      return NextResponse.json({ error: logError.message }, { status: 500 })
    }

    const { error: updateError } = await service
      .from('listings')
      .update({
        ai_verification_score: confidence_score,
        ai_verification_notes: reasoning,
        ai_recommended_action: recommended_action,
        updated_at: new Date().toISOString(),
      })
      .eq('id', listing_id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, recommendation_id: recommendation.id })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
