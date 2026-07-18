import type { ReactElement } from 'react'
import { render } from '@react-email/render'
import { createServiceClient } from '@/lib/rigburrito/service'
import { EMAIL_FROM, getResend } from './resendClient'

export type EmailTemplateType =
  | 'ListingApproved'
  | 'ListingNeedsChanges'
  | 'ListingRemoved'
  | 'NewInquirySeller'
  | 'InquiryReceivedBuyer'
  | 'OrgInvite'
  | 'PrimaryOwnerSetup'
  | 'OwnershipTransferRequest'
  | 'PlanDowngradeListingOverflow'

export interface SendTransactionalEmailParams {
  templateType: EmailTemplateType
  recipientEmail: string
  subject: string
  react: ReactElement
  relatedEntityType?: string | null
  relatedEntityId?: string | null
  replyTo?: string
}

export async function sendTransactionalEmail(
  params: SendTransactionalEmailParams,
): Promise<{ sent: boolean }> {
  const service = createServiceClient()
  let status: 'sent' | 'failed' = 'failed'
  let errorMessage: string | null = null

  try {
    const resend = getResend()
    if (!resend) {
      errorMessage = 'RESEND_API_KEY not configured'
    } else {
      const html = await render(params.react)
      const { error } = await resend.emails.send({
        from: EMAIL_FROM,
        to: params.recipientEmail,
        subject: params.subject,
        html,
        ...(params.replyTo ? { reply_to: params.replyTo } : {}),
      })

      if (error) {
        errorMessage = error.message
      } else {
        status = 'sent'
      }
    }
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : 'Unknown email send error'
    console.error(`[email] ${params.templateType} failed:`, errorMessage)
  }

  const { error: logError } = await service.from('email_log').insert({
    recipient_email: params.recipientEmail,
    template_type: params.templateType,
    related_entity_type: params.relatedEntityType ?? null,
    related_entity_id: params.relatedEntityId ?? null,
    status,
    error_message: errorMessage,
  })

  if (logError) {
    console.error('[email] failed to write email_log:', logError.message)
  }

  return { sent: status === 'sent' }
}

export function sendTransactionalEmailSafe(params: SendTransactionalEmailParams): void {
  void sendTransactionalEmail(params)
}
