export type MetricKey =
  | 'total_users'
  | 'active_listings'
  | 'mrr'
  | 'new_signups'
  | 'new_listings'
  | 'user_locations'

export interface MetricHistoryPoint {
  week: string
  label: string
  value: number
}

function getWeekStart(d: Date): string {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff)
  date.setHours(0, 0, 0, 0)
  return date.toISOString().slice(0, 10)
}

export function buildWeekLabels(count = 8): { week: string; label: string; end: Date }[] {
  const weeks: { week: string; label: string; end: Date }[] = []
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i * 7)
    const week = getWeekStart(d)
    const end = new Date(week)
    end.setDate(end.getDate() + 6)
    end.setHours(23, 59, 59, 999)
    weeks.push({
      week,
      label: end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      end,
    })
  }
  return weeks
}

export function buildCumulativeUserHistory(
  users: { created_at: string }[],
  weeks = buildWeekLabels(),
): MetricHistoryPoint[] {
  return weeks.map(({ week, label, end }) => ({
    week,
    label,
    value: users.filter(u => new Date(u.created_at) <= end).length,
  }))
}

/** Approximation: active listings created on or before each week end. Not a true historical snapshot. */
export function buildActiveListingsHistory(
  listings: { created_at: string; status: string }[],
  weeks = buildWeekLabels(),
): MetricHistoryPoint[] {
  return weeks.map(({ week, label, end }) => ({
    week,
    label,
    value: listings.filter(
      l => l.status === 'active' && new Date(l.created_at) <= end,
    ).length,
  }))
}

export function buildWeeklyCountHistory(
  rows: { created_at: string }[],
  weeks = buildWeekLabels(),
): MetricHistoryPoint[] {
  return weeks.map(({ week, label }) => {
    const start = new Date(week)
    const end = new Date(week)
    end.setDate(end.getDate() + 7)
    return {
      week,
      label,
      value: rows.filter(r => {
        const t = new Date(r.created_at)
        return t >= start && t < end
      }).length,
    }
  })
}

/** MRR history is not available from Stripe in this integration — flat line at current value. */
export function buildMrrHistory(currentMrr: number, weeks = buildWeekLabels()): MetricHistoryPoint[] {
  return weeks.map(({ week, label }) => ({ week, label, value: currentMrr }))
}
