export type InquiryTrustLabel = 'verified_member' | 'unverified_free'

export type ContentRiskFlag =
  | 'overseas_shipping'
  | 'off_platform_request'
  | 'urgency_pressure'
  | 'unusual_payment'
  | 'other'

export interface InquiryContentScanResult {
  content_risk_score: number
  content_risk_flags: ContentRiskFlag[]
  agent_reasoning: string
}

export interface InquiryVerificationRecord {
  inquiry_id: string
  buyer_tier_at_submission: string
  trust_label: InquiryTrustLabel
  content_risk_score: number
  content_risk_flags: ContentRiskFlag[]
  agent_reasoning: string
}

export interface BuyerTrustSnapshot {
  buyer_tier_at_submission: string
  trust_label: InquiryTrustLabel
}

/** Risk score at or above this threshold triggers seller email warning. */
export const INQUIRY_CONTENT_RISK_WARNING_THRESHOLD = 60

export const INQUIRY_VERIFICATION_AGENT_NAME = 'Inquiry Verification Agent'
