import { getActiveOrgMembership } from '@/lib/organizations/auth'

/** Fields to stamp on new listings when the creator belongs to an active org. */
export async function orgFieldsForNewListing(userId: string): Promise<{
  organization_id?: string
  posted_by_user_id?: string
}> {
  const membership = await getActiveOrgMembership(userId)
  if (!membership) return {}

  return {
    organization_id: membership.organization_id,
    posted_by_user_id: userId,
  }
}
