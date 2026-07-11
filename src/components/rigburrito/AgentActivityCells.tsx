import type { AgentActivityRow } from '@/lib/rigburrito/agentActivity'
import {
  SCORE_CRITERIA,
  agentPillColors,
  confidenceTextColor,
  criterionTextColor,
  formatAgentActivitySummary,
  formatOutcomeLabel,
  isListingActivityRow,
  outcomePillColors,
  showAgentFeedback,
} from '@/lib/rigburrito/agentActivity'
import { truncateText } from '@/lib/rigburrito/utils'

function ActivityPill({ label, colors }: { label: string; colors: { text: string; bg: string; border: string } }) {
  return (
    <span
      className="rigburrito-agent-pill"
      style={{
        color: colors.text,
        background: colors.bg,
        borderColor: colors.border,
      }}
    >
      {label}
    </span>
  )
}

export function AgentNamePill({ agentName }: { agentName: string }) {
  return <ActivityPill label={agentName} colors={agentPillColors(agentName)} />
}

export function AgentOutcomePill({ outcome }: { outcome: string | null }) {
  return (
    <ActivityPill
      label={formatOutcomeLabel(outcome)}
      colors={outcomePillColors(outcome)}
    />
  )
}

export function AgentConfidenceValue({ score }: { score: number | null }) {
  if (score == null) return <span className="rigburrito-agent-confidence">—</span>
  return (
    <span
      className="rigburrito-agent-confidence"
      style={{ color: confidenceTextColor(score) }}
    >
      {Math.round(score)}%
    </span>
  )
}

export function AgentListingViewLink({
  row,
  onView,
}: {
  row: AgentActivityRow
  onView: (listingId: string) => void
}) {
  if (!isListingActivityRow(row) || !row.entity_id) {
    return <span style={{ color: '#9CA3AF' }}>—</span>
  }

  return (
    <button
      type="button"
      className="rigburrito-text-link"
      style={{ fontSize: 12, fontWeight: 500, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
      onClick={e => {
        e.stopPropagation()
        onView(row.entity_id!)
      }}
    >
      View
    </button>
  )
}

export function AgentActivitySummary({
  row,
  truncate,
}: {
  row: AgentActivityRow
  truncate?: number
}) {
  const { headline, reasoning, sellerFeedback } = formatAgentActivitySummary(row)

  if (!reasoning && !sellerFeedback) {
    const text = truncate ? truncateText(headline, truncate) : headline
    return <span className="rigburrito-agent-summary-text">{text}</span>
  }

  return (
    <div className="rigburrito-agent-summary">
      <p className="rigburrito-agent-summary-headline">
        {truncate ? truncateText(headline, truncate) : headline}
      </p>
      {reasoning && (
        <p className="rigburrito-agent-summary-line">
          <span className="rigburrito-agent-summary-label">Reasoning:</span>{' '}
          {truncate ? truncateText(reasoning, truncate) : reasoning}
        </p>
      )}
      {sellerFeedback && (
        <p className="rigburrito-agent-summary-line">
          <span className="rigburrito-agent-summary-label">Seller feedback:</span>{' '}
          {truncate ? truncateText(sellerFeedback, truncate) : sellerFeedback}
        </p>
      )}
    </div>
  )
}

export function AgentActivityFeedback({ row }: { row: AgentActivityRow }) {
  if (!showAgentFeedback(row)) return null

  const breakdown = row.score_breakdown

  return (
    <div className="rigburrito-agent-feedback">
      <span className="rigburrito-card-label">Feedback</span>
      {breakdown && (
        <ul className="rigburrito-agent-feedback-breakdown">
          {SCORE_CRITERIA.map(({ key, label }) => {
            const score = breakdown[key]
            return (
              <li key={key} className="rigburrito-agent-feedback-criterion">
                <span className="rigburrito-agent-feedback-criterion-label">{label}</span>
                <span
                  className="rigburrito-agent-feedback-criterion-score"
                  style={{ color: criterionTextColor(score) }}
                >
                  {score}/20
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
