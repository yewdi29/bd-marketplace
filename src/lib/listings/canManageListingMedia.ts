import type { SupabaseClient } from '@supabase/supabase-js'

/** Delegates to Phase 1 DB helper; admins bypass via RLS-aligned role check. */
export async function canManageListingMedia(
  authClient: SupabaseClient,
  listingId: string,
  userId: string,
): Promise<boolean> {
  const { data: canManage, error } = await authClient.rpc('user_can_manage_listing_media', {
    p_listing_id: listingId,
  })

  if (error) {
    console.error('[canManageListingMedia] rpc failed', error)
    return false
  }

  if (canManage) return true

  const { data: profile } = await authClient
    .from('users')
    .select('role')
    .eq('id', userId)
    .maybeSingle()

  return profile?.role === 'admin'
}
