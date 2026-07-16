import { randomUUID } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { dispatchPrimaryOwnerSetupEmail } from '@/lib/email/orgEmails'

const INVITE_TTL_DAYS = 7

export interface CreatePrimaryOwnerInviteResult {
  memberId: string
  inviteToken: string
  inviteExpiresAt: string
}

/**
 * Creates the first primary-owner invite for a brand-new organization.
 * Does not bill for an extra seat — the owner occupies an included base seat.
 */
export async function createPrimaryOwnerInvite(
  service: SupabaseClient,
  opts: {
    organizationId: string
    organizationName: string
    primaryOwnerEmail: string
  },
): Promise<CreatePrimaryOwnerInviteResult> {
  const email = opts.primaryOwnerEmail.trim().toLowerCase()

  const { data: existing } = await service
    .from('org_members')
    .select('id')
    .eq('organization_id', opts.organizationId)
    .eq('invited_email', email)
    .in('status', ['invited', 'active'])
    .maybeSingle()

  if (existing) {
    throw new Error('This email already has a pending or active membership')
  }

  const inviteToken = randomUUID()
  const inviteExpiresAt = new Date()
  inviteExpiresAt.setDate(inviteExpiresAt.getDate() + INVITE_TTL_DAYS)

  const { data: memberRow, error: insertError } = await service
    .from('org_members')
    .insert({
      organization_id: opts.organizationId,
      role: 'owner',
      team_tag: null,
      is_primary_owner: true,
      status: 'invited',
      invited_email: email,
      invite_token: inviteToken,
      invite_expires_at: inviteExpiresAt.toISOString(),
    })
    .select('id')
    .single()

  if (insertError || !memberRow) {
    throw new Error(insertError?.message ?? 'Failed to create primary owner invite')
  }

  dispatchPrimaryOwnerSetupEmail({
    recipientEmail: email,
    memberId: memberRow.id,
    organizationName: opts.organizationName,
    inviteToken,
  })

  return {
    memberId: memberRow.id,
    inviteToken,
    inviteExpiresAt: inviteExpiresAt.toISOString(),
  }
}
