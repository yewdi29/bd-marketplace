interface StatCardProps {
  label: string
  value: string
  trendPct?: number | null
  /** Favorable = green delta; unfavorable metrics can set invertTrendColor */
  invertTrendColor?: boolean
  selected?: boolean
  selectable?: boolean
  onClick?: () => void
}

export default function StatCard({
  label,
  value,
  trendPct,
  invertTrendColor = false,
  selected = false,
  selectable = false,
  onClick,
}: StatCardProps) {
  const hasTrend = trendPct !== null && trendPct !== undefined
  const positive = (trendPct ?? 0) >= 0
  const favorable = invertTrendColor ? !positive : positive

  const className = [
    'rigburrito-stat-card',
    selectable ? 'rigburrito-metric-card--selectable' : '',
    selected ? 'rigburrito-metric-card--selected' : '',
  ].filter(Boolean).join(' ')

  const inner = (
    <>
      <p className="rigburrito-card-label">{label}</p>
      <div className="rigburrito-metric-value-row">
        <p className="rigburrito-stat-value">{value}</p>
        {hasTrend && (
          <span
            className={`rigburrito-metric-delta ${favorable ? 'rigburrito-metric-delta--positive' : 'rigburrito-metric-delta--negative'}`}
          >
            {positive ? '+' : '−'}{Math.abs(trendPct!)}%
          </span>
        )}
      </div>
    </>
  )

  if (selectable && onClick) {
    return (
      <button type="button" className={className} onClick={onClick} aria-pressed={selected}>
        {inner}
      </button>
    )
  }

  return <div className={className}>{inner}</div>
}
