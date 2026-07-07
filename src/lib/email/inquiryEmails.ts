import {
  blockquote,
  emailLayout,
  escapeHtml,
  getAppUrl,
  infoRow,
  sendEmail,
  tierBadge,
} from './resendClient'
import { formatPriceAmount } from '@/lib/formatPrice'

export interface InquiryEmailContext {
  listingTitle: string
  listingPrice: number
  priceUnit?: string
  listingSlug: string | null
  buyerName: string
  buyerEmail: string
  buyerPhone?: string | null
  buyerCompany?: string | null
  message: string
}

function listingUrl(slug: string | null): string {
  const base = getAppUrl()
  return slug ? `${base}/listings/${slug}` : base
}

function formatListingPrice(price: number, priceUnit = 'total'): string {
  return formatPriceAmount(price, priceUnit)
}

function buyerDetailsTable(ctx: InquiryEmailContext): string {
  return `
    <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
      ${infoRow('Name', escapeHtml(ctx.buyerName))}
      ${infoRow('Email', `<a href="mailto:${escapeHtml(ctx.buyerEmail)}" style="color:#FF6B35;">${escapeHtml(ctx.buyerEmail)}</a>`)}
      ${ctx.buyerPhone ? infoRow('Phone', escapeHtml(ctx.buyerPhone)) : ''}
      ${ctx.buyerCompany ? infoRow('Company', escapeHtml(ctx.buyerCompany)) : ''}
    </table>
  `
}

export async function sendSellerInquiryNotification(
  sellerEmail: string,
  ctx: InquiryEmailContext,
): Promise<void> {
  const url = listingUrl(ctx.listingSlug)
  await sendEmail({
    to: sellerEmail,
    subject: `New inquiry on your listing — ${ctx.listingTitle}`,
    replyTo: ctx.buyerEmail,
    html: emailLayout(
      `New inquiry on your listing`,
      `
        <p style="font-size:14px;color:#6B7280;margin-bottom:16px;">You have a new buyer inquiry on <strong>${escapeHtml(ctx.listingTitle)}</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
          ${infoRow('Listing', escapeHtml(ctx.listingTitle))}
          ${infoRow('Price', formatListingPrice(ctx.listingPrice, ctx.priceUnit))}
          ${infoRow('View listing', `<a href="${url}" style="color:#FF6B35;">${url}</a>`)}
        </table>
        <p style="font-size:13px;font-weight:600;color:#0F1117;margin-bottom:8px;">Buyer details</p>
        ${buyerDetailsTable(ctx)}
        <p style="font-size:13px;font-weight:600;color:#0F1117;margin-bottom:8px;">Message</p>
        ${blockquote(ctx.message)}
        <p style="font-size:13px;color:#6B7280;">Reply directly to this email to respond to the buyer.</p>
      `,
    ),
  })
}

export async function sendBuyerInquiryAutoReplyGreen(buyerEmail: string): Promise<void> {
  await sendEmail({
    to: buyerEmail,
    subject: 'We received your inquiry — Black Diamond Marketplace',
    html: emailLayout(
      'We received your inquiry',
      `<p style="font-size:14px;line-height:1.7;">Thank you for reaching out. Your inquiry has been sent to the seller. They will be in touch with you directly.</p>`,
    ),
  })
}

export async function sendBuyerInquiryAutoReplyIntercepted(buyerEmail: string): Promise<void> {
  await sendEmail({
    to: buyerEmail,
    subject: 'We received your inquiry — Black Diamond Marketplace',
    html: emailLayout(
      'We received your inquiry',
      `<p style="font-size:14px;line-height:1.7;">Thank you for your interest. Our team is personally reviewing your inquiry and will be in touch shortly. We appreciate your patience.</p>`,
    ),
  })
}

export async function sendAdminInquiryAlert(
  dealTier: 'yellow' | 'red',
  ctx: InquiryEmailContext,
): Promise<void> {
  const adminEmail = process.env.ADMIN_ALERT_EMAIL
  if (!adminEmail) {
    console.warn('[email] ADMIN_ALERT_EMAIL not set — skipping admin alert')
    return
  }

  const tierLabel = dealTier === 'yellow' ? 'YELLOW' : 'RED'
  const url = listingUrl(ctx.listingSlug)
  const leadsUrl = `${getAppUrl()}/rigburrito/leads`

  await sendEmail({
    to: adminEmail,
    subject: `[${tierLabel} REVIEW REQUIRED] New inquiry — ${ctx.listingTitle}`,
    html: emailLayout(
      `${tierLabel} REVIEW REQUIRED`,
      `
        <div style="background:#FEF2F2;border:2px solid ${dealTier === 'yellow' ? '#FDE68A' : '#FECACA'};border-radius:12px;padding:20px;margin-bottom:20px;">
          <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#0F1117;">Action required — review this inquiry before forwarding to the seller.</p>
          ${tierBadge(dealTier)}
        </div>
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
          ${infoRow('Listing', escapeHtml(ctx.listingTitle))}
          ${infoRow('Price', formatListingPrice(ctx.listingPrice, ctx.priceUnit))}
          ${infoRow('Listing URL', `<a href="${url}" style="color:#FF6B35;">${url}</a>`)}
        </table>
        ${buyerDetailsTable(ctx)}
        <p style="font-size:13px;font-weight:600;color:#0F1117;margin-bottom:8px;">Full message</p>
        ${blockquote(ctx.message)}
        <p style="margin-top:24px;">
          <a href="${leadsUrl}" style="display:inline-block;background:#FF6B35;color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-size:14px;font-weight:600;">Review in Command Center →</a>
        </p>
      `,
    ),
  })
}

export async function sendBuyerForwardedNotification(buyerEmail: string): Promise<void> {
  await sendEmail({
    to: buyerEmail,
    subject: 'Great news — Black Diamond Marketplace',
    html: emailLayout(
      'Connected with the seller',
      `<p style="font-size:14px;line-height:1.7;">Great news — we've connected you with the seller. Expect to hear from them shortly.</p>`,
    ),
  })
}

export async function sendBuyerDenialNotification(buyerEmail: string): Promise<void> {
  await sendEmail({
    to: buyerEmail,
    subject: 'Regarding your inquiry — Black Diamond Marketplace',
    html: emailLayout(
      'Regarding your inquiry',
      `<p style="font-size:14px;line-height:1.7;">Thank you for your interest. After careful review, we are unable to facilitate this inquiry at this time. Please continue browsing our marketplace for other opportunities.</p>`,
    ),
  })
}

export async function sendListingRemovedNotification(
  sellerEmail: string,
  listingTitle: string,
): Promise<void> {
  await sendEmail({
    to: sellerEmail,
    subject: 'Your listing has been removed — Black Diamond Marketplace',
    html: emailLayout(
      'Listing removed',
      `
        <p style="font-size:14px;line-height:1.7;">Your listing <strong>${escapeHtml(listingTitle)}</strong> has been removed from Black Diamond Marketplace for violating our listing guidelines.</p>
        <p style="font-size:14px;line-height:1.7;">If you believe this was an error, please contact us at <a href="mailto:support@blackdiamonddrilling.com" style="color:#FF6B35;">support@blackdiamonddrilling.com</a>.</p>
      `,
    ),
  })
}

export async function sendListingFlaggedNotification(
  sellerEmail: string,
  listingTitle: string,
  flagComment: string,
): Promise<void> {
  const dashboardUrl = `${getAppUrl()}/dashboard`
  await sendEmail({
    to: sellerEmail,
    subject: `Action required on your listing — ${listingTitle}`,
    html: emailLayout(
      'Action required on your listing',
      `
        <p style="font-size:14px;line-height:1.7;">Your listing <strong>${escapeHtml(listingTitle)}</strong> requires updates before it can remain published.</p>
        <p style="font-size:13px;font-weight:600;color:#0F1117;margin-bottom:8px;">Feedback from our team</p>
        ${blockquote(flagComment)}
        <p style="font-size:14px;line-height:1.7;">Please update your listing based on the feedback above and republish it for review.</p>
        <p style="margin-top:16px;">
          <a href="${dashboardUrl}" style="display:inline-block;background:#FF6B35;color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-size:14px;font-weight:600;">Go to Dashboard →</a>
        </p>
      `,
    ),
  })
}
