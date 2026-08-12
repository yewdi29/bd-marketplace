import { NextRequest, NextResponse } from 'next/server'
import {
  LISTING_VERIFIER_AGENT_NAME,
  publishListingFromVerificationApprove,
  shouldAutoApproveListing,
} from '@/lib/agents/listingVerificationPublish'
import { verifyPaperclipSecret } from '@/lib/agents/verifyPaperclipSecret'
import { createServiceClient } from '@/lib/rigburrito/service'

const AGENT_NAME = LISTING_VERIFIER_AGENT_NAME

interface ScoreBreakdown {
  title: number
  required_fields: number
  description: number
  photos: number
  price: number
}

function isScoreBreakdown(value: unknown): value is ScoreBreakdown {
  if (!value || typeof value !== 'object') return false
  const row = value as Record<string, unknown>
  return ['title', 'required_fields', 'description', 'photos', 'price'].every(
    key => typeof row[key] === 'number',
  )
}

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
      score_breakdown,
    } = body as {
      listing_id?: string
      recommended_action?: 'approve' | 'flag'
      confidence_score?: number
      reasoning?: string
      flag_comment?: string
      score_breakdown?: ScoreBreakdown
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

    if (score_breakdown != null && !isScoreBreakdown(score_breakdown)) {
      return NextResponse.json({ error: 'Invalid score_breakdown' }, { status: 400 })
    }

    const service = createServiceClient()

    const { data: listing, error: listingError } = await service
      .from('listings')
      .select('id, title, updated_at, users!listings_seller_id_fkey(email)')
      .eq('id', listing_id)
      .single()

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    // Idempotency: recommendation already exists for this review cycle
    // (created at/after listing.updated_at when it entered pending_review).
    const { data: existingForCycle } = await service
      .from('agent_recommendations')
      .select('id, status, created_at')
      .eq('agent_name', AGENT_NAME)
      .eq('entity_type', 'listing')
      .eq('entity_id', listing_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (
      existingForCycle
      && listing.updated_at
      && existingForCycle.created_at >= listing.updated_at
    ) {
      return NextResponse.json({
        success: true,
        recommendation_id: existingForCycle.id,
        deduplicated: true,
      })
    }

    const { data: existingPending } = await service
      .from('agent_recommendations')
      .select('id')
      .eq('agent_name', AGENT_NAME)
      .eq('entity_type', 'listing')
      .eq('entity_id', listing_id)
      .eq('status', 'pending')
      .maybeSingle()

    if (existingPending) {
      return NextResponse.json({
        success: true,
        recommendation_id: existingPending.id,
        deduplicated: true,
      })
    }

    const autoApprove = shouldAutoApproveListing(recommended_action, confidence_score)

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
        status: autoApprove ? 'accepted' : 'pending',
      })
      .select('id')
      .single()

    if (recError || !recommendation) {
      if (recError?.code === '23505') {
        const { data: racedPending } = await service
          .from('agent_recommendations')
          .select('id')
          .eq('agent_name', AGENT_NAME)
          .eq('entity_type', 'listing')
          .eq('entity_id', listing_id)
          .eq('status', 'pending')
          .maybeSingle()

        if (racedPending) {
          return NextResponse.json({
            success: true,
            recommendation_id: racedPending.id,
            deduplicated: true,
          })
        }
      }

      return NextResponse.json({ error: recError?.message ?? 'Failed to save recommendation' }, { status: 500 })
    }

    if (autoApprove) {
      const publishResult = await publishListingFromVerificationApprove(service, listing_id)
      if (!publishResult.ok) {
        return NextResponse.json({ error: publishResult.error }, { status: publishResult.status })
      }

      const { error: logError } = await service.from('agent_activity_log').insert({
        agent_name: AGENT_NAME,
        action: 'verification_complete',
        entity_type: 'listing',
        entity_id: listing_id,
        outcome: 'auto_approved',
        summary: `Auto-approved ${listing.title} (confidence: ${confidence_score}%)`,
        overall_score: confidence_score,
        score_breakdown: score_breakdown ?? null,
        flag_comment: null,
        reasoning,
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

      return NextResponse.json({
        success: true,
        recommendation_id: recommendation.id,
        auto_approved: true,
      })
    }

    const actionLabel = recommended_action.toUpperCase()
    const summary = `Recommended ${actionLabel} for ${listing.title}`

    const { error: logError } = await service.from('agent_activity_log').insert({
      agent_name: AGENT_NAME,
      action: 'verification_complete',
      entity_type: 'listing',
      entity_id: listing_id,
      outcome: 'pending_review',
      summary,
      overall_score: confidence_score,
      score_breakdown: score_breakdown ?? null,
      flag_comment: flag_comment?.trim() ?? null,
      reasoning,
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

    // Do NOT email the seller on raw agent flag recommendations.
    // ListingNeedsChanges fires only after admin accept/override on /confirm
    // (or via the separate manual admin flag route).

    return NextResponse.json({ success: true, recommendation_id: recommendation.id })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
