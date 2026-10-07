import { sendEmail } from '@/lib/email/resendClient'
import { PUBLIC_SITE_URL } from '@/lib/site'

export interface EnterprisePaymentFailedAlertParams {
  organizationId: string
  organizationName: string
  invoiceId: string
  amountDue: number
  failureMessage: string
}

/** Internal admin alert for failed Enterprise billing — not a seller/buyer template. */
export async function sendEnterprisePaymentFailedAlert(
  params: EnterprisePaymentFailedAlertParams,
): Promise<void> {
  const adminEmail = process.env.ADMIN_ALERT_EMAIL
  if (!adminEmail) {
    console.warn('[email] ADMIN_ALERT_EMAIL not set — enterprise payment failure not emailed')
    console.error('[enterprise/billing] payment failed:', params)
    return
  }

  const amount = (params.amountDue / 100).toFixed(2)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? PUBLIC_SITE_URL

  await sendEmail({
    to: adminEmail,
    subject: `[Enterprise Billing] Payment failed — ${params.organizationName}`,
    html: `
      <h2>Enterprise payment failed</h2>
      <p><strong>Organization:</strong> ${params.organizationName}</p>
      <p><strong>Organization ID:</strong> ${params.organizationId}</p>
      <p><strong>Invoice:</strong> ${params.invoiceId}</p>
      <p><strong>Amount due:</strong> $${amount}</p>
      <p><strong>Reason:</strong> ${params.failureMessage}</p>
      <p>Review in Stripe and the Phase 5 Enterprise Accounts tab (when available).</p>
      <p><a href="${appUrl}/rigburrito">Open command center</a></p>
    `,
  })
}
