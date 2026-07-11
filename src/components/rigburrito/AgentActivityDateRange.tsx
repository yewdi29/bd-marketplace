'use client'

import {
  AGENT_ACTIVITY_RANGE_OPTIONS,
  type AgentActivityDateRange,
} from '@/lib/rigburrito/agentActivityDateRange'

interface AgentActivityDateRangeProps {
  value: AgentActivityDateRange
  onChange: (range: AgentActivityDateRange) => void
}

export default function AgentActivityDateRangeControl({
  value,
  onChange,
}: AgentActivityDateRangeProps) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
      <span className="rigburrito-caption" style={{ color: '#6B7280' }}>
        Show
      </span>
      <select
        value={value}
        onChange={event => onChange(event.target.value as AgentActivityDateRange)}
        className="rigburrito-select"
        aria-label="Agent activity date range"
      >
        {AGENT_ACTIVITY_RANGE_OPTIONS.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
