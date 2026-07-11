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

/** Internal admin alert — not one of the five seller/buyer transactional templates. */
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

/** Internal admin alert for red-tier listing publish — not a seller/buyer template. */
export async function sendRedTierListingAlert(opts: {
  listingTitle: string
  listingPrice: number
  sellerName: string
  sellerEmail: string
}): Promise<void> {
  const adminEmail = process.env.ADMIN_ALERT_EMAIL
  if (!adminEmail) {
    console.warn('[email] ADMIN_ALERT_EMAIL not set — skipping red tier alert')
    return
  }

  const commandCenterUrl = `${getAppUrl()}/rigburrito/listings`
  const formattedPrice = formatPriceAmount(opts.listingPrice, 'total')

  await sendEmail({
    to: adminEmail,
    subject: `[RED TIER] New high-value listing — ${opts.listingTitle}`,
    html: emailLayout(
      'Red tier listing published',
      `
        <div style="background:#FEF2F2;border:2px solid #FECACA;border-radius:12px;padding:20px;margin-bottom:20px;">
          <p style="margin:0;font-size:14px;font-weight:600;color:#DC2626;">This listing exceeds $500,000 and requires your immediate review.</p>
        </div>
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
          ${infoRow('Listing', escapeHtml(opts.listingTitle))}
          ${infoRow('Price', formattedPrice)}
          ${infoRow('Seller', escapeHtml(opts.sellerName))}
          ${infoRow('Seller email', `<a href="mailto:${escapeHtml(opts.sellerEmail)}" style="color:#FF6B35;">${escapeHtml(opts.sellerEmail)}</a>`)}
        </table>
        <p style="margin-top:24px;">
          <a href="${commandCenterUrl}" style="display:inline-block;background:#FF6B35;color:#fff;text-decoration:none;padding:12px 24px;border-radius:999px;font-size:14px;font-weight:600;">Review in Command Center →</a>
        </p>
      `,
    ),
  })
}
