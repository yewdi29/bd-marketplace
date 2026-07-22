import type { SupabaseClient } from '@supabase/supabase-js'
import { getBuyerTrustSnapshot } from '@/lib/inquiryVerification/buyerTrust'
import { scanInquiryContent } from '@/lib/inquiryVerification/contentScan'
import { persistInquiryVerification } from '@/lib/inquiryVerification/persist'
import type { InquiryVerificationRecord } from '@/lib/inquiryVerification/types'

export async function runInquiryVerification(opts: {
  client: SupabaseClient
  inquiryId: string
  buyerUserId: string
  buyerName: string
  message: string
  listingTitle?: string
}): Promise<InquiryVerificationRecord> {
  const trust = await getBuyerTrustSnapshot(opts.client, opts.buyerUserId)
  const scan = await scanInquiryContent(opts.message, opts.buyerName)

  const record: InquiryVerificationRecord = {
    inquiry_id: opts.inquiryId,
    buyer_tier_at_submission: trust.buyer_tier_at_submission,
    trust_label: trust.trust_label,
    content_risk_score: scan.content_risk_score,
    content_risk_flags: scan.content_risk_flags,
    agent_reasoning: scan.agent_reasoning,
  }

  await persistInquiryVerification(opts.client, record, {
    listingTitle: opts.listingTitle,
    buyerName: opts.buyerName,
  })

  return record
}

export type { InquiryVerificationRecord } from '@/lib/inquiryVerification/types'
export {
  INQUIRY_CONTENT_RISK_WARNING_THRESHOLD,
  INQUIRY_VERIFICATION_AGENT_NAME,
} from '@/lib/inquiryVerification/types'
export { formatRiskFlagsForDisplay } from '@/lib/inquiryVerification/contentScan'
export { scheduleInquiryVerification } from '@/lib/inquiryVerification/scheduleVerification'
export { runInquiryVerificationPipeline } from '@/lib/inquiryVerification/runPipeline'
export { triggerInquiryVerificationAgent } from '@/lib/inquiryVerification/triggerAgent'
export { sendNewInquirySellerEmailOnce } from '@/lib/inquiryVerification/sendSellerEmail'
