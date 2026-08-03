import { createElement } from 'react'
import Welcome from '../../../emails/templates/Welcome'
import { createServiceClient } from '@/lib/rigburrito/service'
import { getEmailAppUrl } from './resendClient'
import { sendTransactionalEmail } from './sendTransactionalEmail'

/**
 * Sends the branded Welcome email once after signup email confirmation.
 * Deduped via email_log so repeat visits to /auth/callback never re-send.
 */
export async function dispatchWelcomeEmailOnce(opts: {
  userId: string
  recipientEmail: string
  firstName?: string | null
}): Promise<{ sent: boolean; deduplicated: boolean }> {
  const service = createServiceClient()

  const { data: existing } = await service
    .from('email_log')
    .select('id')
    .eq('template_type', 'Welcome')
    .eq('related_entity_type', 'user')
    .eq('related_entity_id', opts.userId)
    .maybeSingle()

  if (existing) {
    return { sent: false, deduplicated: true }
  }

  const base = getEmailAppUrl()
  const result = await sendTransactionalEmail({
    templateType: 'Welcome',
    recipientEmail: opts.recipientEmail,
    relatedEntityType: 'user',
    relatedEntityId: opts.userId,
    subject: 'Welcome to Black Diamond Marketplace',
    react: createElement(Welcome, {
      firstName: opts.firstName ?? null,
      browseUrl: `${base}/search`,
      dashboardUrl: `${base}/dashboard`,
    }),
  })

  return { sent: result.sent, deduplicated: false }
}

export function dispatchWelcomeEmailOnceSafe(opts: {
  userId: string
  recipientEmail: string
  firstName?: string | null
}): void {
  void dispatchWelcomeEmailOnce(opts).catch(err => {
    console.error('[email] Welcome dispatch failed:', err)
  })
}
