import { dispatchListingRemovedEmail } from '@/lib/email/transactionalEmails'
import { createServiceClient } from '@/lib/rigburrito/service'

type ServiceClient = ReturnType<typeof createServiceClient>

/**
 * Shared ListingRemoved path used by manual admin DELETE and the
 * verification review page reject action.
 */
export async function removeListingWithReason(
  service: ServiceClient,
  listingId: string,
  removalReason: string,
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const reason = removalReason.trim()
  if (!reason || reason.length < 20) {
    return {
      ok: false,
      error: 'removal_reason is required and must be at least 20 characters',
      status: 400,
    }
  }

  const { data: listing } = await service
    .from('listings')
    .select('id, title, users!listings_seller_id_fkey(email)')
    .eq('id', listingId)
    .single()

  if (!listing) {
    return { ok: false, error: 'Listing not found', status: 404 }
  }

  const now = new Date().toISOString()
  const { error } = await service
    .from('listings')
    .update({ status: 'removed', removal_reason: reason, updated_at: now })
    .eq('id', listingId)

  if (error) {
    return { ok: false, error: error.message, status: 500 }
  }

  const seller = listing.users as unknown as { email: string } | null
  if (seller?.email && listing.title) {
    await dispatchListingRemovedEmail({
      sellerEmail: seller.email,
      listingId: listing.id,
      listingTitle: listing.title,
      removalReason: reason,
    })
  }

  return { ok: true }
}
