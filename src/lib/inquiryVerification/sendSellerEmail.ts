import type { SupabaseClient } from '@supabase/supabase-js'
import { createElement } from 'react'
import NewInquirySeller from '../../../emails/templates/NewInquirySeller'
import { formatRiskFlagsForDisplay } from '@/lib/inquiryVerification/contentScan'
import type { InquiryVerificationRecord } from '@/lib/inquiryVerification/types'
import { getEmailAppUrl } from '@/lib/email/resendClient'
import { sendTransactionalEmail } from '@/lib/email/sendTransactionalEmail'

const FALLBACK_VERIFICATION: InquiryVerificationRecord = {
  inquiry_id: '',
  buyer_tier_at_submission: 'unknown',
  trust_label: 'unverified_free',
  content_risk_score: 0,
  content_risk_flags: [],
  agent_reasoning: '',
}

export async function sendNewInquirySellerEmailOnce(
  client: SupabaseClient,
  leadId: string,
  opts?: { includeVerification?: boolean },
): Promise<{ sent: boolean; deduplicated: boolean }> {
  const includeVerification = opts?.includeVerification !== false

  const { data: lead, error } = await client
    .from('leads')
    .select(`
      id,
      buyer_name,
      buyer_email,
      buyer_phone,
      buyer_company,
      message,
      status,
      tier,
      seller_inquiry_email_sent_at,
      listings(title, slug, users!listings_seller_id_fkey(email))
    `)
    .eq('id', leadId)
    .single()

  if (error || !lead) {
    throw new Error('Inquiry not found')
  }

  if (lead.seller_inquiry_email_sent_at) {
    return { sent: false, deduplicated: true }
  }

  // Green-tier immediate path only — yellow/red use admin approval.
  if (lead.tier !== 'green' || lead.status !== 'new') {
    return { sent: false, deduplicated: true }
  }

  const listing = lead.listings as unknown as {
    title: string
    slug: string | null
    users: { email: string } | null
  } | null

  const sellerEmail = listing?.users?.email
  if (!sellerEmail) {
    throw new Error('Seller email not found')
  }

  const listingUrl = listing?.slug
    ? `${getEmailAppUrl()}/listings/${listing.slug}`
    : `${getEmailAppUrl()}/dashboard`

  let verification: InquiryVerificationRecord | null = null
  if (includeVerification) {
    const { data: verificationRow } = await client
      .from('inquiry_verifications')
      .select('*')
      .eq('inquiry_id', leadId)
      .maybeSingle()

    if (verificationRow) {
      verification = {
        inquiry_id: verificationRow.inquiry_id,
        buyer_tier_at_submission: verificationRow.buyer_tier_at_submission,
        trust_label: verificationRow.trust_label,
        content_risk_score: verificationRow.content_risk_score,
        content_risk_flags: verificationRow.content_risk_flags ?? [],
        agent_reasoning: verificationRow.agent_reasoning,
      }
    }
  }

  const v = verification ?? { ...FALLBACK_VERIFICATION, inquiry_id: leadId }
  const showVerification = includeVerification && verification !== null

  const result = await sendTransactionalEmail({
    templateType: 'NewInquirySeller',
    recipientEmail: sellerEmail,
    relatedEntityType: 'inquiry',
    relatedEntityId: leadId,
    subject: `New inquiry on your listing — ${listing?.title ?? 'your listing'}`,
    replyTo: lead.buyer_email,
    react: createElement(NewInquirySeller, {
      listingTitle: listing?.title ?? 'Your listing',
      buyerName: lead.buyer_name,
      buyerEmail: lead.buyer_email,
      buyerCompany: lead.buyer_company,
      buyerPhone: lead.buyer_phone,
      buyerMessage: lead.message,
      listingUrl,
      showVerification,
      trustLabel: v.trust_label,
      buyerTierAtSubmission: v.buyer_tier_at_submission,
      contentRiskScore: v.content_risk_score,
      contentRiskFlagSummary: formatRiskFlagsForDisplay(v.content_risk_flags),
      agentReasoning: v.agent_reasoning,
    }),
  })

  if (result.sent) {
    const now = new Date().toISOString()
    const { data: claimed } = await client
      .from('leads')
      .update({ seller_inquiry_email_sent_at: now, updated_at: now })
      .eq('id', leadId)
      .is('seller_inquiry_email_sent_at', null)
      .select('id')
      .maybeSingle()

    if (!claimed) {
      return { sent: false, deduplicated: true }
    }
  }

  return { sent: result.sent, deduplicated: false }
}
