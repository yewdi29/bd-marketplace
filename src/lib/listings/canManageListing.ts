import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@supabase/supabase-js'

/**
 * Whether the current user may manage a listing (edit, status, media).
 * Uses the same DB rule as media: seller, active org owner, or eligible manager.
 *
 * Also covers a transitional gap: listings created while in an org but never
 * stamped with organization_id — org owners of the seller's active org may manage them.
 */
export async function canManageListing(
  authClient: SupabaseClient,
  listingId: string,
  userId: string,
): Promise<boolean> {
  const { data: canManage, error } = await authClient.rpc('user_can_manage_listing_media', {
    p_listing_id: listingId,
  })

  if (error) {
    console.error('[canManageListing] rpc failed', error)
  } else if (canManage) {
    return true
  }

  const { data: profile } = await authClient
    .from('users')
    .select('role')
    .eq('id', userId)
    .maybeSingle()

  if (profile?.role === 'admin') return true

  // Service-role fallback for unstamped org-member listings (organization_id null).
  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: listing } = await service
    .from('listings')
    .select('seller_id, organization_id')
    .eq('id', listingId)
    .maybeSingle()

  if (!listing) return false
  if (listing.seller_id === userId) return true

  // Already org-stamped: RPC should have covered owners/managers; don't broaden further.
  if (listing.organization_id) return false

  const { data: requesterMembership } = await service
    .from('org_members')
    .select('organization_id, role')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  if (!requesterMembership || requesterMembership.role !== 'owner') return false

  const { data: sellerMembership } = await service
    .from('org_members')
    .select('id')
    .eq('user_id', listing.seller_id)
    .eq('organization_id', requesterMembership.organization_id)
    .eq('status', 'active')
    .maybeSingle()

  return Boolean(sellerMembership)
}
