import type {
  ContentRiskFlag,
  InquiryContentScanResult,
} from '@/lib/inquiryVerification/types'

const MODEL = 'claude-sonnet-4-6'
const MAX_TOKENS = 400
const SCAN_TIMEOUT_MS = 8000

const KNOWN_FLAGS = new Set<ContentRiskFlag>([
  'overseas_shipping',
  'off_platform_request',
  'urgency_pressure',
  'unusual_payment',
  'other',
])

const FALLBACK_RESULT: InquiryContentScanResult = {
  content_risk_score: 0,
  content_risk_flags: [],
  agent_reasoning:
    'Automated content scan was unavailable. No risk indicators were applied to this inquiry.',
}

function parseScanResult(raw: unknown): InquiryContentScanResult {
  if (!raw || typeof raw !== 'object') throw new Error('Invalid scan payload')

  const row = raw as Record<string, unknown>
  const score = Number(row.content_risk_score)
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    throw new Error('Invalid content_risk_score')
  }

  const reasoning =
    typeof row.agent_reasoning === 'string' ? row.agent_reasoning.trim() : ''
  if (!reasoning) throw new Error('Missing agent_reasoning')

  const flagsRaw = Array.isArray(row.content_risk_flags) ? row.content_risk_flags : []
  const content_risk_flags = flagsRaw
    .filter((f): f is string => typeof f === 'string')
    .map(f => (KNOWN_FLAGS.has(f as ContentRiskFlag) ? (f as ContentRiskFlag) : 'other'))

  return {
    content_risk_score: Math.round(score),
    content_risk_flags,
    agent_reasoning: reasoning,
  }
}

function buildPrompt(message: string, buyerName: string): string {
  return `You are the Inquiry Verification Agent for Black Diamond Marketplace, a B2B heavy equipment marketplace. Evaluate this buyer inquiry message for scam-pattern language. This is an informational risk scan only — never block or reject inquiries.

BUYER NAME: ${buyerName}

INQUIRY MESSAGE:
"""
${message}
"""

Flag patterns including but not limited to:
- overseas_shipping: unprompted overseas shipping, export, or remote pickup arrangements
- off_platform_request: pressure to move communication off-platform immediately (WhatsApp, Telegram, personal email/phone) before a normal exchange
- unusual_payment: cashier's checks, money orders, payment for more than asking price, wire transfer pressure
- urgency_pressure: high-pressure urgency ("need this today", "my agent is waiting", "act now")
- other: any other pattern consistent with equipment/vehicle marketplace scam tactics

Return ONLY valid JSON — no markdown fences, no other text:
{
  "content_risk_score": <integer 0-100, where 0 is no concern and 100 is severe scam indicators>,
  "content_risk_flags": ["<flag_id>", ...],
  "agent_reasoning": "<plain-language explanation for the seller — one to three sentences; if score is low, state that no significant risk patterns were detected>"
}`
}

async function callAnthropic(message: string, buyerName: string): Promise<InquiryContentScanResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.warn('[InquiryVerification] ANTHROPIC_API_KEY not set — using fallback')
    return FALLBACK_RESULT
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), SCAN_TIMEOUT_MS)

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        messages: [{ role: 'user', content: buildPrompt(message, buyerName) }],
      }),
      signal: controller.signal,
    })

    if (!res.ok) {
      console.error('[InquiryVerification] Anthropic error:', res.status, await res.text())
      return FALLBACK_RESULT
    }

    const data = (await res.json()) as { content?: { type: string; text?: string }[] }
    const text = data.content?.[0]?.text?.replace(/```json|```/g, '').trim() ?? ''
    if (!text) return FALLBACK_RESULT

    return parseScanResult(JSON.parse(text))
  } catch (err) {
    console.error('[InquiryVerification] Scan failed:', err)
    return FALLBACK_RESULT
  } finally {
    clearTimeout(timeout)
  }
}

export async function scanInquiryContent(
  message: string,
  buyerName: string,
): Promise<InquiryContentScanResult> {
  return callAnthropic(message, buyerName)
}

export function formatRiskFlagsForDisplay(flags: ContentRiskFlag[]): string {
  const labels: Record<ContentRiskFlag, string> = {
    overseas_shipping: 'overseas shipping or pickup arrangements',
    off_platform_request: 'requests to move communication off-platform',
    urgency_pressure: 'high-pressure urgency language',
    unusual_payment: 'unusual payment methods or overpayment schemes',
    other: 'other suspicious patterns',
  }

  const unique = Array.from(new Set(flags))
  if (!unique.length) return 'suspicious language patterns'
  return unique.map(f => labels[f] ?? labels.other).join('; ')
}
