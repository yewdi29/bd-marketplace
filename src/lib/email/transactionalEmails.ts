import { createElement } from 'react'
import ListingApproved from '../../../emails/templates/ListingApproved'
import ListingNeedsChanges from '../../../emails/templates/ListingNeedsChanges'
import ListingRemoved from '../../../emails/templates/ListingRemoved'
import ListingVerificationAdminReview from '../../../emails/templates/ListingVerificationAdminReview'
import NewInquirySeller from '../../../emails/templates/NewInquirySeller'
import InquiryReceivedBuyer from '../../../emails/templates/InquiryReceivedBuyer'
import PlanDowngradeListingOverflow from '../../../emails/templates/PlanDowngradeListingOverflow'
import type { InquiryVerificationRecord } from '@/lib/inquiryVerification'
import { formatRiskFlagsForDisplay } from '@/lib/inquiryVerification'
import { getEmailAppUrl } from './resendClient'
import { sendTransactionalEmailSafe } from './sendTransactionalEmail'

function listingPublicUrl(slug: string | null): string {
  const base = getEmailAppUrl()
  return slug ? `${base}/listings/${slug}` : base
}

export async function dispatchListingApprovedEmail(opts: {
  sellerEmail: string
  listingId: string
  listingTitle: string
  listingSlug: string | null
}): Promise<void> {
  sendTransactionalEmailSafe({
    templateType: 'ListingApproved',
    recipientEmail: opts.sellerEmail,
    relatedEntityType: 'listing',
    relatedEntityId: opts.listingId,
    subject: `Your listing is now live — ${opts.listingTitle}`,
    react: createElement(ListingApproved, {
      listingTitle: opts.listingTitle,
      listingUrl: listingPublicUrl(opts.listingSlug),
    }),
  })
}

export async function dispatchListingNeedsChangesEmail(opts: {
  sellerEmail: string
  listingId: string
  listingTitle: string
  flagComment: string
}): Promise<void> {
  const editUrl = `${getEmailAppUrl()}/dashboard`
  sendTransactionalEmailSafe({
    templateType: 'ListingNeedsChanges',
    recipientEmail: opts.sellerEmail,
    relatedEntityType: 'listing',
    relatedEntityId: opts.listingId,
    subject: `Updates needed on your listing — ${opts.listingTitle}`,
    react: createElement(ListingNeedsChanges, {
      listingTitle: opts.listingTitle,
      flagComment: opts.flagComment,
      editUrl,
    }),
  })
}

export async function dispatchListingVerificationAdminReviewEmail(opts: {
  listingId: string
  listingTitle: string
  listingSlug: string | null
  confidenceScore: number
  reasoning: string
  flagComment: string
  reviewToken: string
}): Promise<void> {
  const adminEmail = process.env.ADMIN_ALERT_EMAIL
  if (!adminEmail) {
    console.warn('[email] ADMIN_ALERT_EMAIL not set — skipping listing verification admin review')
    return
  }

  const params = new URLSearchParams({ token_hash: opts.reviewToken })
  const reviewUrl = `${getEmailAppUrl()}/rigburrito/listing-review?${params.toString()}`

  sendTransactionalEmailSafe({
    templateType: 'ListingVerificationAdminReview',
    recipientEmail: adminEmail,
    relatedEntityType: 'listing',
    relatedEntityId: opts.listingId,
    subject: `Listing needs review — ${opts.listingTitle}`,
    react: createElement(ListingVerificationAdminReview, {
      listingTitle: opts.listingTitle,
      listingUrl: opts.listingSlug ? listingPublicUrl(opts.listingSlug) : null,
      confidenceScore: opts.confidenceScore,
      reasoning: opts.reasoning,
      flagComment: opts.flagComment,
      reviewUrl,
    }),
  })
}

export async function dispatchListingRemovedEmail(opts: {
  sellerEmail: string
  listingId: string
  listingTitle: string
  removalReason: string
}): Promise<void> {
  sendTransactionalEmailSafe({
    templateType: 'ListingRemoved',
    recipientEmail: opts.sellerEmail,
    relatedEntityType: 'listing',
    relatedEntityId: opts.listingId,
    subject: `Your listing has been removed — ${opts.listingTitle}`,
    react: createElement(ListingRemoved, {
      listingTitle: opts.listingTitle,
      removalReason: opts.removalReason,
    }),
  })
}

export async function dispatchNewInquirySellerEmail(opts: {
  sellerEmail: string
  leadId: string
  listingTitle: string
  listingSlug?: string | null
  buyerName: string
  buyerEmail: string
  buyerMessage: string
  buyerCompany?: string | null
  buyerPhone?: string | null
  verification: InquiryVerificationRecord
}): Promise<void> {
  const listingUrl = opts.listingSlug
    ? `${getEmailAppUrl()}/listings/${opts.listingSlug}`
    : `${getEmailAppUrl()}/dashboard`

  sendTransactionalEmailSafe({
    templateType: 'NewInquirySeller',
    recipientEmail: opts.sellerEmail,
    relatedEntityType: 'inquiry',
    relatedEntityId: opts.leadId,
    subject: `New inquiry on your listing — ${opts.listingTitle}`,
    replyTo: opts.buyerEmail,
    react: createElement(NewInquirySeller, {
      listingTitle: opts.listingTitle,
      buyerName: opts.buyerName,
      buyerEmail: opts.buyerEmail,
      buyerCompany: opts.buyerCompany,
      buyerPhone: opts.buyerPhone,
      buyerMessage: opts.buyerMessage,
      listingUrl,
      showVerification: true,
      trustLabel: opts.verification.trust_label,
      buyerTierAtSubmission: opts.verification.buyer_tier_at_submission,
      contentRiskScore: opts.verification.content_risk_score,
      contentRiskFlagSummary: formatRiskFlagsForDisplay(opts.verification.content_risk_flags),
      agentReasoning: opts.verification.agent_reasoning,
    }),
  })
}

export async function dispatchInquiryReceivedBuyerEmail(opts: {
  buyerEmail: string
  leadId: string
  listingTitle: string
  listingSlug?: string | null
}): Promise<void> {
  const listingUrl = opts.listingSlug
    ? `${getEmailAppUrl()}/listings/${opts.listingSlug}`
    : getEmailAppUrl()

  sendTransactionalEmailSafe({
    templateType: 'InquiryReceivedBuyer',
    recipientEmail: opts.buyerEmail,
    relatedEntityType: 'inquiry',
    relatedEntityId: opts.leadId,
    subject: "We've received your inquiry — Black Diamond Marketplace",
    react: createElement(InquiryReceivedBuyer, {
      listingTitle: opts.listingTitle,
      listingUrl,
    }),
  })
}

export function dispatchPlanDowngradeListingOverflowEmail(opts: {
  sellerEmail: string
  userId: string
  newPlanLabel: string
  unpublishedCount: number
  keptActiveCount: number
}): void {
  sendTransactionalEmailSafe({
    templateType: 'PlanDowngradeListingOverflow',
    recipientEmail: opts.sellerEmail,
    relatedEntityType: 'user',
    relatedEntityId: opts.userId,
    subject: `${opts.unpublishedCount} listing${opts.unpublishedCount === 1 ? '' : 's'} unpublished — ${opts.newPlanLabel} plan`,
    react: createElement(PlanDowngradeListingOverflow, {
      newPlanLabel: opts.newPlanLabel,
      unpublishedCount: opts.unpublishedCount,
      keptActiveCount: opts.keptActiveCount,
      dashboardUrl: `${getEmailAppUrl()}/dashboard`,
      upgradeUrl: `${getEmailAppUrl()}/dashboard/upgrade`,
    }),
  })
}
