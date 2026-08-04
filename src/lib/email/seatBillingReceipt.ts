import { createElement } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { managerHasBillingAccess } from '@/lib/organizations/managerPermissions'
import type { SeatChangePreview } from '@/lib/stripe/enterpriseSubscription'
import SeatBillingReceipt from '../../../emails/templates/SeatBillingReceipt'
import { getEmailAppUrl } from './resendClient'
import { sendTransactionalEmail } from './sendTransactionalEmail'

export type SeatChangeActor = {
  userId?: string | null
  name?: string | null
}

function formatAmountLabel(preview: SeatChangePreview): string {
  if (!preview.requiresBillingChange) {
    return 'No additional charge (within included seats)'
  }

  const cents = preview.proratedAmountCents
  const dollars = Math.abs(cents) / 100
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(dollars)

  if (cents > 0) return `${formatted} charge (prorated)`
  if (cents < 0) return `${formatted} credit (prorated)`
  return 'No additional charge'
}

async function resolveBillingRecipients(
  service: SupabaseClient,
  organizationId: string,
): Promise<Array<{ userId: string; email: string }>> {
  const { data: members, error } = await service
    .from('org_members')
    .select('user_id, role, can_access_billing, status')
    .eq('organization_id', organizationId)
    .eq('status', 'active')

  if (error || !members?.length) {
    if (error) console.error('[seatBillingReceipt] members query failed:', error)
    return []
  }

  const billingUserIds = members
    .filter(m => m.user_id && managerHasBillingAccess({
      role: m.role,
      can_access_billing: Boolean(m.can_access_billing),
    }))
    .map(m => m.user_id as string)

  const uniqueIds = Array.from(new Set(billingUserIds))
  if (uniqueIds.length === 0) return []

  const { data: users, error: usersError } = await service
    .from('users')
    .select('id, email')
    .in('id', uniqueIds)

  if (usersError) {
    console.error('[seatBillingReceipt] users query failed:', usersError)
    return []
  }

  return (users ?? [])
    .filter((u): u is { id: string; email: string } => Boolean(u.email))
    .map(u => ({ userId: u.id, email: u.email }))
}

/**
 * Email every Owner / billing-access Manager after a successful seat change.
 * Safe / non-throwing — never blocks the seat commit path.
 */
export async function dispatchSeatBillingReceipt(opts: {
  service: SupabaseClient
  organizationId: string
  changeType: 'add' | 'remove'
  preview: SeatChangePreview
  logId: string
  actor?: SeatChangeActor | null
}): Promise<{ sent: number; failed: number }> {
  const { data: org } = await opts.service
    .from('organizations')
    .select('name')
    .eq('id', opts.organizationId)
    .maybeSingle()

  const organizationName = org?.name?.trim() || 'Your organization'
  const recipients = await resolveBillingRecipients(opts.service, opts.organizationId)
  const amountLabel = formatAmountLabel(opts.preview)
  const billingUrl = `${getEmailAppUrl()}/dashboard/organization?tab=billing`
  const actorName = opts.actor?.name?.trim() || null
  const actorUserId = opts.actor?.userId ?? null

  let sent = 0
  let failed = 0

  for (const recipient of recipients) {
    const showActorLine = Boolean(
      actorName && actorUserId && actorUserId !== recipient.userId,
    )

    try {
      const result = await sendTransactionalEmail({
        templateType: 'SeatBillingReceipt',
        recipientEmail: recipient.email,
        relatedEntityType: 'seat_change_log',
        relatedEntityId: opts.logId,
        subject:
          opts.changeType === 'add'
            ? `Seat added — ${organizationName}`
            : `Seat removed — ${organizationName}`,
        react: createElement(SeatBillingReceipt, {
          organizationName,
          changeType: opts.changeType,
          actorName,
          showActorLine,
          newSeatCount: opts.preview.projectedMemberCount,
          amountLabel,
          billingUrl,
        }),
      })
      if (result.sent) sent++
      else failed++
    } catch (err) {
      failed++
      console.error('[seatBillingReceipt] send failed:', recipient.email, err)
    }
  }

  return { sent, failed }
}

export function dispatchSeatBillingReceiptSafe(opts: {
  service: SupabaseClient
  organizationId: string
  changeType: 'add' | 'remove'
  preview: SeatChangePreview
  logId: string
  actor?: SeatChangeActor | null
}): void {
  void dispatchSeatBillingReceipt(opts).catch(err => {
    console.error('[seatBillingReceipt] dispatch failed:', err)
  })
}

/** Resolve display name for the user who triggered a seat change. */
export async function resolveSeatChangeActorName(
  service: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data } = await service
    .from('users')
    .select('full_name, email')
    .eq('id', userId)
    .maybeSingle()

  const name = data?.full_name?.trim()
  if (name) return name
  return data?.email?.trim() || null
}
