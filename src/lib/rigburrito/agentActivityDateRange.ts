export type AgentActivityDateRange = 'today' | '3d' | '7d' | 'all'

export const AGENT_ACTIVITY_RANGE_STORAGE_KEY = 'rigburrito:agent-activity-range'
export const DEFAULT_AGENT_ACTIVITY_RANGE: AgentActivityDateRange = '3d'

export const AGENT_ACTIVITY_RANGE_OPTIONS: { value: AgentActivityDateRange; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: '3d', label: 'Last 3 days' },
  { value: '7d', label: 'Last 7 days' },
  { value: 'all', label: 'All time' },
]

const VALID_RANGES = new Set<string>(AGENT_ACTIVITY_RANGE_OPTIONS.map(option => option.value))

export function isAgentActivityDateRange(value: string): value is AgentActivityDateRange {
  return VALID_RANGES.has(value)
}

export function loadStoredAgentActivityRange(): AgentActivityDateRange | null {
  if (typeof window === 'undefined') return null
  const stored = window.localStorage.getItem(AGENT_ACTIVITY_RANGE_STORAGE_KEY)
  if (!stored || !isAgentActivityDateRange(stored)) return null
  return stored
}

export function storeAgentActivityRange(range: AgentActivityDateRange): void {
  window.localStorage.setItem(AGENT_ACTIVITY_RANGE_STORAGE_KEY, range)
}

/** Server-side lower bound for `agent_activity_log.created_at` (inclusive). */
export function agentActivityCreatedAtLowerBound(range: AgentActivityDateRange): string | null {
  if (range === 'all') return null

  const now = new Date()

  if (range === 'today') {
    const start = new Date(now)
    start.setUTCHours(0, 0, 0, 0)
    return start.toISOString()
  }

  const days = range === '3d' ? 3 : 7
  const since = new Date(now)
  since.setUTCDate(since.getUTCDate() - days)
  return since.toISOString()
}
