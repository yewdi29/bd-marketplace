import type { SupabaseClient } from '@supabase/supabase-js'
import { confirmRemoveSeat } from '@/lib/stripe/enterpriseSubscription'

export interface ExpireOrgInvitesResult {
  processed: number
  expiredMemberIds: string[]
  errors: string[]
}

/**
 * Releases billed seats for invites that were never accepted within 7 days.
 * Uses confirmRemoveSeat() so Stripe quantity and seat_change_log stay in sync.
 */
export async function expireOrganizationInvites(
  service: SupabaseClient,
  opts?: { dryRun?: boolean; organizationId?: string },
): Promise<ExpireOrgInvitesResult> {
  const dryRun = opts?.dryRun ?? false
  const result: ExpireOrgInvitesResult = {
    processed: 0,
    expiredMemberIds: [],
    errors: [],
  }

  let query = service
    .from('org_members')
    .select('id, organization_id, invited_email, invite_expires_at')
    .eq('status', 'invited')
    .lt('invite_expires_at', new Date().toISOString())

  if (opts?.organizationId) {
    query = query.eq('organization_id', opts.organizationId)
  }

  const { data: expiredInvites, error } = await query

  if (error) {
    result.errors.push(error.message)
    return result
  }

  for (const invite of expiredInvites ?? []) {
    try {
      if (!dryRun) {
        await confirmRemoveSeat(service, invite.organization_id)

        const { error: updateError } = await service
          .from('org_members')
          .update({ status: 'expired' })
          .eq('id', invite.id)

        if (updateError) {
          throw new Error(updateError.message)
        }
      }

      result.processed += 1
      result.expiredMemberIds.push(invite.id)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      result.errors.push(`Member ${invite.id}: ${message}`)
    }
  }

  return result
}
