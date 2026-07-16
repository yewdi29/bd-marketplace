import {
  emailLayout,
  escapeHtml,
  getEmailAppUrl,
  infoRow,
  sendEmail,
} from './resendClient'
import type { EnterpriseDealMetadata } from '@/lib/organizations/enterpriseDealMetadata'

export async function sendEnterpriseInquiryAlert(opts: {
  dealId: string
  metadata: EnterpriseDealMetadata
}): Promise<void> {
  const adminEmail = process.env.ADMIN_ALERT_EMAIL
  if (!adminEmail) {
    console.warn('[email] ADMIN_ALERT_EMAIL not set — enterprise inquiry visible in Deal Tracker only')
    return
  }

  const dealUrl = `${getEmailAppUrl()}/rigburrito/deals?highlight=${opts.dealId}`
  const m = opts.metadata

  await sendEmail({
    to: adminEmail,
    subject: `[ENTERPRISE] New inquiry — ${m.company_name}`,
    html: emailLayout(
      'New Enterprise inquiry',
      `
        <div style="background:#FFF2ED;border:2px solid #FFD4C2;border-radius:12px;padding:20px;margin-bottom:20px;">
          <p style="margin:0;font-size:14px;font-weight:600;color:#FF6B35;">A new Enterprise pricing inquiry was submitted from the public site.</p>
        </div>
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
          ${infoRow('Company', escapeHtml(m.company_name))}
          ${infoRow('Contact', escapeHtml(m.contact_name))}
          ${infoRow('Email', `<a href="mailto:${escapeHtml(m.contact_email)}" style="color:#FF6B35;">${escapeHtml(m.contact_email)}</a>`)}
          ${m.contact_phone ? infoRow('Phone', escapeHtml(m.contact_phone)) : ''}
          ${infoRow('Est. team size', String(m.estimated_team_size))}
          ${infoRow('Locations / regions', escapeHtml(m.locations_regions))}
          ${m.message ? infoRow('Notes', escapeHtml(m.message)) : ''}
        </table>
        <p style="margin-top:24px;">
          <a href="${dealUrl}" style="display:inline-block;background:#FF6B35;color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-size:14px;font-weight:600;">Open in Deal Tracker →</a>
        </p>
      `,
    ),
  })
}
