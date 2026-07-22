import type { SupabaseClient } from '@supabase/supabase-js'
import type { InquiryVerificationRecord } from '@/lib/inquiryVerification/types'

const FALLBACK_VERIFICATION = (
  inquiryId: string,
): InquiryVerificationRecord => ({
  inquiry_id: inquiryId,
  buyer_tier_at_submission: 'unknown',
  trust_label: 'unverified_free',
  content_risk_score: 0,
  content_risk_flags: [],
  agent_reasoning: 'Verification record not found. Review this inquiry with standard caution.',
})

export async function loadInquiryVerification(
  client: SupabaseClient,
  inquiryId: string,
): Promise<InquiryVerificationRecord> {
  const { data } = await client
    .from('inquiry_verifications')
    .select('*')
    .eq('inquiry_id', inquiryId)
    .maybeSingle()

  if (!data) return FALLBACK_VERIFICATION(inquiryId)

  return {
    inquiry_id: data.inquiry_id,
    buyer_tier_at_submission: data.buyer_tier_at_submission,
    trust_label: data.trust_label,
    content_risk_score: data.content_risk_score,
    content_risk_flags: (data.content_risk_flags as InquiryVerificationRecord['content_risk_flags']) ?? [],
    agent_reasoning: data.agent_reasoning,
  }
}
