import { NextRequest, NextResponse } from 'next/server'
import {
  LISTING_VERIFIER_AGENT_NAME,
  publishListingFromVerificationApprove,
} from '@/lib/agents/listingVerificationPublish'
import {
  acceptPendingFlagRecommendation,
  updateVerificationLogOutcome,
} from '@/lib/agents/listingVerificationFlag'
import { removeListingWithReason } from '@/lib/agents/listingRemoval'
import {
  claimListingReviewToken,
  finalizeListingReviewStatus,
  findPendingReviewByToken,
  releaseListingReviewToken,
  reviewTokenIsUsable,
} from '@/lib/agents/listingVerificationReviewToken'
import { requireAdminApi } from '@/lib/rigburrito/auth'
import { createServiceClient } from '@/lib/rigburrito/service'

const AGENT_NAME = LISTING_VERIFIER_AGENT_NAME

function tokenFromRequest(req: NextRequest, bodyToken?: string): string {
  const fromQuery = req.nextUrl.searchParams.get('token_hash')?.trim() ?? ''
  const fromBody = bodyToken?.trim() ?? ''
  return fromBody || fromQuery
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminApi()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const token = tokenFromRequest(req)
  if (!token) {
    return NextResponse.json({ error: 'token_hash is required' }, { status: 400 })
  }

  const service = createServiceClient()
  const found = await findPendingReviewByToken(service, token)
  if (!found) {
    return NextResponse.json({ error: 'Review link is invalid' }, { status: 404 })
  }

  const usable = reviewTokenIsUsable(found.recommendation)
  const listingId = found.recommendation.entity_id

  const { data: listing } = await service
    .from('listings')
    .select(`
      id, title, slug, status, description, price, price_unit, price_visible,
      location_city, location_state, year, manufacturer, model, condition,
      users!listings_seller_id_fkey(id, full_name, email, company_name),
      industries(name),
      categories:category_id(name),
      listing_images(id, url, alt_text, sort_order, is_primary)
    `)
    .eq('id', listingId)
    .single()

  if (!listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  }

  const seller = Array.isArray(listing.users) ? listing.users[0] ?? null : listing.users

  return NextResponse.json({
    success: true,
    usable: usable.ok,
    unusable_reason: usable.ok ? null : usable.reason,
    listing: { ...listing, users: seller },
    recommendation: {
      id: found.recommendation.id,
      confidence_score: found.recommendation.confidence_score,
      reasoning: found.recommendation.reasoning,
      flag_comment: found.recommendation.flag_comment,
      recommended_action: found.recommendation.recommended_action,
    },
  })
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  let body: {
    token_hash?: string
    action?: 'confirm_flag' | 'reject' | 'override'
    removal_reason?: string
    override_note?: string
  }
  try {
    body = await req.json() as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const token = tokenFromRequest(req, body.token_hash)
  if (!token) {
    return NextResponse.json({ error: 'token_hash is required' }, { status: 400 })
  }

  if (!body.action || !['confirm_flag', 'reject', 'override'].includes(body.action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const service = createServiceClient()
  const found = await findPendingReviewByToken(service, token)
  if (!found) {
    return NextResponse.json({ error: 'Review link is invalid' }, { status: 404 })
  }

  const usable = reviewTokenIsUsable(found.recommendation)
  if (!usable.ok) {
    return NextResponse.json({ error: 'This review link is no longer valid' }, { status: 410 })
  }

  const listingId = found.recommendation.entity_id
  const recommendationId = found.recommendation.id

  const claimed = await claimListingReviewToken(service, recommendationId)
  if (!claimed) {
    return NextResponse.json({ error: 'This review link is no longer valid' }, { status: 410 })
  }

  try {
    if (body.action === 'confirm_flag') {
      const comment = (found.recommendation.flag_comment ?? '').trim()
      const flagResult = await acceptPendingFlagRecommendation(service, {
        recommendationId,
        listingId,
        flagComment: comment,
        adminId: auth.userId,
      })
      if (!flagResult.ok) {
        await releaseListingReviewToken(service, recommendationId)
        return NextResponse.json({ error: flagResult.error }, { status: flagResult.status })
      }

      return NextResponse.json({ success: true, action: 'confirm_flag' })
    }

    if (body.action === 'reject') {
      const result = await removeListingWithReason(service, listingId, body.removal_reason ?? '')
      if (!result.ok) {
        await releaseListingReviewToken(service, recommendationId)
        return NextResponse.json({ error: result.error }, { status: result.status })
      }

      await finalizeListingReviewStatus(service, recommendationId, 'accepted')
      await updateVerificationLogOutcome(service, listingId, 'flagged')

      return NextResponse.json({ success: true, action: 'reject' })
    }

    const publishResult = await publishListingFromVerificationApprove(service, listingId)
    if (!publishResult.ok) {
      await releaseListingReviewToken(service, recommendationId)
      return NextResponse.json({ error: publishResult.error }, { status: publishResult.status })
    }

    await finalizeListingReviewStatus(service, recommendationId, 'overridden')

    const note = body.override_note?.trim() || null
    await service.from('agent_activity_log').insert({
      agent_name: AGENT_NAME,
      action: 'verification_override',
      entity_type: 'listing',
      entity_id: listingId,
      outcome: 'overridden',
      summary: `Admin overrode low score and published listing ${listingId}`,
      reasoning: note,
      flag_comment: note,
    })

    return NextResponse.json({ success: true, action: 'override' })
  } catch {
    await releaseListingReviewToken(service, recommendationId)
    return NextResponse.json({ error: 'Review action failed' }, { status: 500 })
  }
}
