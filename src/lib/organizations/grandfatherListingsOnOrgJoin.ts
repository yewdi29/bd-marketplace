import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Links pre-org personal listings to the organization a user just joined.
 * Only updates rows where organization_id IS NULL (pre-existing listings).
 */
export async function grandfatherPreExistingListingsIntoOrg(
  service: SupabaseClient,
  userId: string,
  organizationId: string,
): Promise<number> {
  const { data: needsPoster, error: posterError } = await service
    .from('listings')
    .update({
      organization_id: organizationId,
      posted_by_user_id: userId,
    })
    .eq('seller_id', userId)
    .is('organization_id', null)
    .is('posted_by_user_id', null)
    .select('id')

  if (posterError) {
    throw new Error(posterError.message)
  }

  const { data: hasPoster, error: orgOnlyError } = await service
    .from('listings')
    .update({ organization_id: organizationId })
    .eq('seller_id', userId)
    .is('organization_id', null)
    .not('posted_by_user_id', 'is', null)
    .select('id')

  if (orgOnlyError) {
    throw new Error(orgOnlyError.message)
  }

  return (needsPoster?.length ?? 0) + (hasPoster?.length ?? 0)
}
