import { createElement } from 'react'
import ListingApproved from '../../../emails/templates/ListingApproved'
import ListingNeedsChanges from '../../../emails/templates/ListingNeedsChanges'
import ListingRemoved from '../../../emails/templates/ListingRemoved'
import NewInquirySeller from '../../../emails/templates/NewInquirySeller'
import InquiryReceivedBuyer from '../../../emails/templates/InquiryReceivedBuyer'
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
    }),
  })
}

export async function dispatchInquiryReceivedBuyerEmail(opts: {
  buyerEmail: string
  leadId: string
  listingTitle: string
}): Promise<void> {
  sendTransactionalEmailSafe({
    templateType: 'InquiryReceivedBuyer',
    recipientEmail: opts.buyerEmail,
    relatedEntityType: 'inquiry',
    relatedEntityId: opts.leadId,
    subject: "We've received your inquiry — Black Diamond Marketplace",
    react: createElement(InquiryReceivedBuyer, {
      listingTitle: opts.listingTitle,
    }),
  })
}
