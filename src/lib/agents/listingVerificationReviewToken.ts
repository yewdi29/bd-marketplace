import { createHash, randomBytes } from 'crypto'
import { createServiceClient } from '@/lib/rigburrito/service'

type ServiceClient = ReturnType<typeof createServiceClient>

export const LISTING_REVIEW_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000

export function hashListingReviewToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function createListingReviewToken(): {
  token: string
  tokenHash: string
  expiresAt: string
} {
  const token = randomBytes(32).toString('hex')
  return {
    token,
    tokenHash: hashListingReviewToken(token),
    expiresAt: new Date(Date.now() + LISTING_REVIEW_TOKEN_TTL_MS).toISOString(),
  }
}

export async function findPendingReviewByToken(
  service: ServiceClient,
  token: string,
): Promise<{
  recommendation: {
    id: string
    entity_id: string
    recommended_action: string
    confidence_score: number | null
    reasoning: string | null
    flag_comment: string | null
    status: string
    review_token_expires_at: string | null
    review_consumed_at: string | null
  }
} | null> {
  const tokenHash = hashListingReviewToken(token)
  const { data } = await service
    .from('agent_recommendations')
    .select(
      'id, entity_id, recommended_action, confidence_score, reasoning, flag_comment, status, review_token_expires_at, review_consumed_at',
    )
    .eq('review_token_hash', tokenHash)
    .maybeSingle()

  if (!data) return null
  return { recommendation: data }
}

export function reviewTokenIsUsable(rec: {
  status: string
  review_token_expires_at: string | null
  review_consumed_at: string | null
}): { ok: true } | { ok: false; reason: 'used' | 'expired' | 'resolved' } {
  if (rec.review_consumed_at) return { ok: false, reason: 'used' }
  if (rec.status !== 'pending') return { ok: false, reason: 'resolved' }
  if (rec.review_token_expires_at && new Date(rec.review_token_expires_at) < new Date()) {
    return { ok: false, reason: 'expired' }
  }
  return { ok: true }
}

/**
 * Atomically claim the token before an action so a second click cannot run.
 * Does not change recommendation status. Returns false if already used or no longer pending.
 */
export async function claimListingReviewToken(
  service: ServiceClient,
  recommendationId: string,
): Promise<boolean> {
  const now = new Date().toISOString()
  const { data } = await service
    .from('agent_recommendations')
    .update({
      review_consumed_at: now,
      updated_at: now,
    })
    .eq('id', recommendationId)
    .eq('status', 'pending')
    .is('review_consumed_at', null)
    .select('id')
    .maybeSingle()

  return Boolean(data?.id)
}

/** Undo a claim when the chosen action fails, so the admin can retry. */
export async function releaseListingReviewToken(
  service: ServiceClient,
  recommendationId: string,
): Promise<void> {
  await service
    .from('agent_recommendations')
    .update({
      review_consumed_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', recommendationId)
}

export async function finalizeListingReviewStatus(
  service: ServiceClient,
  recommendationId: string,
  nextStatus: 'accepted' | 'overridden',
): Promise<void> {
  await service
    .from('agent_recommendations')
    .update({
      status: nextStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', recommendationId)
}
