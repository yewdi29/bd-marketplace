export interface AgentScoreBreakdown {
  title: number
  required_fields: number
  description: number
  photos: number
  price: number
}

export interface AgentActivityRow {
  id: string
  agent_name: string
  action: string
  entity_type: string | null
  entity_id: string | null
  outcome: string | null
  summary: string
  created_at: string
  overall_score: number | null
  score_breakdown: AgentScoreBreakdown | null
  flag_comment: string | null
  reasoning: string | null
}

interface PillColors {
  text: string
  bg: string
  border: string
}

/** Confidence text colors — distinct from tier badges and outcome pills. */
export const CONFIDENCE_COLORS = {
  high: '#16A34A',
  medium: '#D97706',
  low: '#DC2626',
} as const

/** Agent pill colors keyed to stored agent_name values. */
export const AGENT_PILL_COLORS: Record<string, PillColors> = {
  'Listing Verifier': { text: '#0E7490', bg: '#ECFEFF', border: '#A5F3FC' },
  'Lead Scorer': { text: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
  'Inquiry Verification Agent': { text: '#0E7490', bg: '#ECFEFF', border: '#A5F3FC' },
  'Red Alert': { text: '#E85D4A', bg: '#FFF1EE', border: '#FACFC7' },
}

const NEUTRAL_PILL: PillColors = { text: '#6B7280', bg: '#F9FAFB', border: '#E5E7EB' }

const OUTCOME_PILL_COLORS: Record<string, PillColors> = {
  pending_review: { text: '#C2410C', bg: '#FFF7ED', border: '#FDBA74' },
  approved: { text: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
  scored: { text: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
  alerted: { text: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
  flagged: { text: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
  overridden: { text: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
}

export const SCORE_CRITERIA: { key: keyof AgentScoreBreakdown; label: string }[] = [
  { key: 'title', label: 'Title' },
  { key: 'required_fields', label: 'Required fields' },
  { key: 'description', label: 'Description' },
  { key: 'photos', label: 'Photos' },
  { key: 'price', label: 'Price' },
]

export function confidenceTextColor(score: number): string {
  if (score >= 75) return CONFIDENCE_COLORS.high
  if (score >= 55) return CONFIDENCE_COLORS.medium
  return CONFIDENCE_COLORS.low
}

export function criterionTextColor(score: number, max = 20): string {
  const pct = (score / max) * 100
  return confidenceTextColor(pct)
}

export function agentPillColors(agentName: string): PillColors {
  return AGENT_PILL_COLORS[agentName] ?? NEUTRAL_PILL
}

export function outcomePillColors(outcome: string | null): PillColors {
  if (!outcome) return NEUTRAL_PILL
  return OUTCOME_PILL_COLORS[outcome] ?? NEUTRAL_PILL
}

export function formatOutcomeLabel(outcome: string | null): string {
  if (!outcome) return '—'
  return outcome.replace(/_/g, ' ')
}

export function agentFeedbackMessage(row: AgentActivityRow): string {
  if (row.flag_comment?.trim()) return row.flag_comment.trim()
  const confidence = resolveAgentConfidence(row)
  if (
    row.action === 'verification_complete'
    && (confidence ?? 0) >= 75
    && !row.flag_comment
  ) {
    return 'No issues identified — listing met all quality criteria'
  }
  if (row.reasoning?.trim()) return row.reasoning.trim()
  return 'No issues identified — listing met all quality criteria'
}

export function showAgentFeedback(row: AgentActivityRow): boolean {
  return row.agent_name === 'Listing Verifier'
    && (row.score_breakdown != null || row.flag_comment != null || row.reasoning != null)
}

const CONFIDENCE_SUMMARY_RE = /\s*\(confidence:\s*(\d+(?:\.\d+)?)%\)\s*$/i

/** Legacy rows stored confidence only inside the summary string. */
export function parseConfidenceFromSummary(summary: string): number | null {
  const match = summary.match(CONFIDENCE_SUMMARY_RE)
  if (!match) return null
  const score = Number(match[1])
  return Number.isFinite(score) ? score : null
}

export function stripConfidenceFromSummary(summary: string): string {
  return summary.replace(CONFIDENCE_SUMMARY_RE, '').trim()
}

export function resolveAgentConfidence(row: AgentActivityRow): number | null {
  if (row.overall_score != null) return Number(row.overall_score)
  return parseConfidenceFromSummary(row.summary)
}

export function formatAgentSummary(row: AgentActivityRow): string {
  return stripConfidenceFromSummary(row.summary)
}

export interface AgentActivitySummaryParts {
  headline: string
  reasoning: string | null
  sellerFeedback: string | null
}

export function formatAgentActivitySummary(row: AgentActivityRow): AgentActivitySummaryParts {
  const headline = formatAgentSummary(row)

  if (row.agent_name !== 'Listing Verifier') {
    return { headline, reasoning: null, sellerFeedback: null }
  }

  return {
    headline,
    reasoning: row.reasoning?.trim() || null,
    sellerFeedback: row.flag_comment?.trim() || null,
  }
}

export function agentActivitySummaryText(row: AgentActivityRow): string {
  const parts = formatAgentActivitySummary(row)
  const lines = [parts.headline]
  if (parts.reasoning) lines.push(`Reasoning: ${parts.reasoning}`)
  if (parts.sellerFeedback) lines.push(`Seller feedback: ${parts.sellerFeedback}`)
  return lines.join('\n')
}

export function isListingActivityRow(row: AgentActivityRow): boolean {
  return row.entity_type === 'listing' && row.entity_id != null
}

export function parseScoreBreakdown(value: unknown): AgentScoreBreakdown | null {
  if (!value || typeof value !== 'object') return null
  const row = value as Record<string, unknown>
  const keys = ['title', 'required_fields', 'description', 'photos', 'price'] as const
  if (!keys.every(key => typeof row[key] === 'number')) return null
  return {
    title: row.title as number,
    required_fields: row.required_fields as number,
    description: row.description as number,
    photos: row.photos as number,
    price: row.price as number,
  }
}
