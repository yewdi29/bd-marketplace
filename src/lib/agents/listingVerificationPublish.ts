import { dispatchListingApprovedEmail } from '@/lib/email/transactionalEmails'
import { createServiceClient } from '@/lib/rigburrito/service'

export const LISTING_VERIFIER_AGENT_NAME = 'Listing Verifier'

/** Minimum confidence_score required for agent auto-approve (independent of recommended_action). */
export const LISTING_AUTO_APPROVE_SCORE = 75

/** Flag recommendations below this score require admin review email (no seller email). */
export const LISTING_ADMIN_REVIEW_BELOW_SCORE = 55

export function shouldAutoFlagAndNotifySeller(
  recommendedAction: 'approve' | 'flag',
  confidenceScore: number,
): boolean {
  return (
    recommendedAction === 'flag'
    && confidenceScore >= LISTING_ADMIN_REVIEW_BELOW_SCORE
    && confidenceScore < LISTING_AUTO_APPROVE_SCORE
  )
}

export function shouldRequestAdminReview(
  recommendedAction: 'approve' | 'flag',
  confidenceScore: number,
): boolean {
  return recommendedAction === 'flag' && confidenceScore < LISTING_ADMIN_REVIEW_BELOW_SCORE
}

type ServiceClient = ReturnType<typeof createServiceClient>

/**
 * Publish a listing after a Listing Verifier approve recommendation.
 * Shared by auto-approve on agent POST and admin accept on /confirm.
 */
export async function publishListingFromVerificationApprove(
  service: ServiceClient,
  listingId: string,
  options?: { recommendationId?: string },
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const { data: listing, error: listingError } = await service
    .from('listings')
    .select('id, title, slug, users!listings_seller_id_fkey(email)')
    .eq('id', listingId)
    .single()

  if (listingError || !listing) {
    return { ok: false, error: 'Listing not found', status: 404 }
  }

  const now = new Date().toISOString()
  const { error: updateError } = await service
    .from('listings')
    .update({
      status: 'active',
      admin_flagged: false,
      last_approved_at: now,
      updated_at: now,
    })
    .eq('id', listingId)

  if (updateError) {
    return { ok: false, error: updateError.message, status: 500 }
  }

  await service
    .from('listing_flags')
    .update({ resolved_at: now })
    .eq('listing_id', listingId)
    .is('resolved_at', null)

  if (options?.recommendationId) {
    const { error: recUpdateError } = await service
      .from('agent_recommendations')
      .update({ status: 'accepted', updated_at: now })
      .eq('id', options.recommendationId)

    if (recUpdateError) {
      return { ok: false, error: recUpdateError.message, status: 500 }
    }
  }

  const seller = listing.users as unknown as { email: string } | null
  if (seller?.email) {
    await dispatchListingApprovedEmail({
      sellerEmail: seller.email,
      listingId,
      listingTitle: listing.title,
      listingSlug: listing.slug,
    })
  }

  return { ok: true }
}

export function shouldAutoApproveListing(
  recommendedAction: 'approve' | 'flag',
  confidenceScore: number,
): boolean {
  return recommendedAction === 'approve' && confidenceScore >= LISTING_AUTO_APPROVE_SCORE
}
