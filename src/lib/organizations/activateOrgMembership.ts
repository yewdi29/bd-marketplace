import type { SupabaseClient } from '@supabase/supabase-js'
import { grandfatherPreExistingListingsIntoOrg } from '@/lib/organizations/grandfatherListingsOnOrgJoin'

export interface ActivateOrgMemberOnJoinInput {
  memberId: string
  userId: string
  organizationId: string
}

export interface ActivateOrgMemberOnJoinResult {
  activated: boolean
  listingsGrandfathered: number
}

/**
 * Activates an org_members row (invited → active) and grandfathers the user's
 * pre-existing personal listings into the organization.
 *
 * Idempotent: if the row is already active, activation and grandfathering are skipped.
 * The status guard on update ensures grandfathering runs only once per membership.
 */
export async function activateOrgMemberOnJoin(
  service: SupabaseClient,
  input: ActivateOrgMemberOnJoinInput,
): Promise<ActivateOrgMemberOnJoinResult> {
  const { data: activatedMember, error: updateError } = await service
    .from('org_members')
    .update({
      user_id: input.userId,
      status: 'active',
      joined_at: new Date().toISOString(),
      invite_token: null,
      invite_expires_at: null,
    })
    .eq('id', input.memberId)
    .eq('status', 'invited')
    .select('id')
    .maybeSingle()

  if (updateError) {
    throw new Error(updateError.message)
  }

  if (!activatedMember) {
    const { data: existing } = await service
      .from('org_members')
      .select('status')
      .eq('id', input.memberId)
      .maybeSingle()

    if (existing?.status === 'active') {
      return { activated: false, listingsGrandfathered: 0 }
    }

    throw new Error('Unable to activate organization membership')
  }

  const listingsGrandfathered = await grandfatherPreExistingListingsIntoOrg(
    service,
    input.userId,
    input.organizationId,
  )

  return { activated: true, listingsGrandfathered }
}
