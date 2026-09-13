import { dispatchListingNeedsChangesEmail } from '@/lib/email/transactionalEmails'
import { createServiceClient } from '@/lib/rigburrito/service'

type ServiceClient = ReturnType<typeof createServiceClient>

/**
 * Shared ListingNeedsChanges path used by:
 * - admin accept of an agent flag on /confirm
 * - autonomous 55–74 flag on the verification webhook
 * - admin review page "Confirm flag"
 */
export async function flagListingForNeedsChanges(
  service: ServiceClient,
  listingId: string,
  comment: string,
  options?: { adminId?: string | null; notifySeller?: boolean },
): Promise<
  | { ok: true; listing: { id: string; title: string } }
  | { ok: false; error: string; status: number }
> {
  const { data: listing, error: listingError } = await service
    .from('listings')
    .select('id, title, users!listings_seller_id_fkey(email)')
    .eq('id', listingId)
    .single()

  if (listingError || !listing) {
    return { ok: false, error: 'Listing not found', status: 404 }
  }

  const { error: flagError } = await service.from('listing_flags').insert({
    listing_id: listingId,
    admin_id: options?.adminId ?? null,
    comment,
  })

  if (flagError) {
    return { ok: false, error: flagError.message, status: 500 }
  }

  const { error: updateError } = await service
    .from('listings')
    .update({
      status: 'draft',
      admin_flagged: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', listingId)

  if (updateError) {
    return { ok: false, error: updateError.message, status: 500 }
  }

  const seller = listing.users as unknown as { email: string } | null
  if (options?.notifySeller !== false && seller?.email) {
    await dispatchListingNeedsChangesEmail({
      sellerEmail: seller.email,
      listingId,
      listingTitle: listing.title,
      flagComment: comment,
    })
  }

  return { ok: true, listing: { id: listing.id, title: listing.title } }
}

export async function updateVerificationLogOutcome(
  service: ServiceClient,
  listingId: string,
  outcome: string,
) {
  const { data: logEntry } = await service
    .from('agent_activity_log')
    .select('id')
    .eq('entity_type', 'listing')
    .eq('entity_id', listingId)
    .eq('action', 'verification_complete')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (logEntry) {
    await service.from('agent_activity_log').update({ outcome }).eq('id', logEntry.id)
  }
}

export async function acceptPendingFlagRecommendation(
  service: ServiceClient,
  input: {
    recommendationId: string
    listingId: string
    flagComment: string
    adminId?: string | null
  },
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const comment = input.flagComment.trim()
  if (!comment || comment.length < 20) {
    return { ok: false, error: 'Agent flag comment is missing or too short', status: 400 }
  }

  const flagResult = await flagListingForNeedsChanges(service, input.listingId, comment, {
    adminId: input.adminId ?? null,
    notifySeller: true,
  })
  if (!flagResult.ok) return flagResult

  const { error: recUpdateError } = await service
    .from('agent_recommendations')
    .update({ status: 'accepted', updated_at: new Date().toISOString() })
    .eq('id', input.recommendationId)

  if (recUpdateError) {
    return { ok: false, error: recUpdateError.message, status: 500 }
  }

  await updateVerificationLogOutcome(service, input.listingId, 'flagged')

  return { ok: true }
}
