import type { SupabaseClient } from '@supabase/supabase-js'
import {
  INQUIRY_CONTENT_RISK_WARNING_THRESHOLD,
  INQUIRY_VERIFICATION_AGENT_NAME,
  type InquiryVerificationRecord,
} from '@/lib/inquiryVerification/types'

export async function persistInquiryVerification(
  client: SupabaseClient,
  record: InquiryVerificationRecord,
  opts?: { listingTitle?: string; buyerName?: string },
): Promise<void> {
  const { data: existing } = await client
    .from('inquiry_verifications')
    .select('id')
    .eq('inquiry_id', record.inquiry_id)
    .maybeSingle()

  if (!existing) {
    const { error: insertError } = await client.from('inquiry_verifications').insert({
      inquiry_id: record.inquiry_id,
      buyer_tier_at_submission: record.buyer_tier_at_submission,
      trust_label: record.trust_label,
      content_risk_score: record.content_risk_score,
      content_risk_flags: record.content_risk_flags,
      agent_reasoning: record.agent_reasoning,
    })

    if (insertError) {
      throw new Error(insertError.message)
    }
  }

  const listingTitle = opts?.listingTitle ?? 'listing inquiry'
  const buyerName = opts?.buyerName ?? 'buyer'
  const riskNote =
    record.content_risk_score >= INQUIRY_CONTENT_RISK_WARNING_THRESHOLD
      ? ` — elevated content risk (${record.content_risk_score}/100)`
      : ''
  const trustNote =
    record.trust_label === 'verified_member' ? 'Verified Member' : 'Free account'

  const summary = `${trustNote} inquiry on ${listingTitle} — ${buyerName}${riskNote}`

  const { error: logError } = await client.from('agent_activity_log').insert({
    agent_name: INQUIRY_VERIFICATION_AGENT_NAME,
    action: 'inquiry_verified',
    entity_type: 'lead',
    entity_id: record.inquiry_id,
    outcome: record.content_risk_score >= INQUIRY_CONTENT_RISK_WARNING_THRESHOLD ? 'flagged' : 'scored',
    summary,
    overall_score: record.content_risk_score,
    flag_comment:
      record.content_risk_flags.length > 0 ? record.content_risk_flags.join(', ') : null,
    reasoning: record.agent_reasoning,
  })

  if (logError) {
    throw new Error(logError.message)
  }
}
