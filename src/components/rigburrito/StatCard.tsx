import { TrendingDown, TrendingUp } from 'lucide-react'
import StatSparkline from './StatSparkline'

interface StatCardProps {
  label: string
  value: string
  trendPct?: number | null
  showSparkline?: boolean
}

export default function StatCard({ label, value, trendPct, showSparkline = true }: StatCardProps) {
  const hasTrend = trendPct !== null && trendPct !== undefined
  const positive = (trendPct ?? 0) >= 0

  return (
    <div className="rigburrito-stat-card">
      <p className="rigburrito-card-label">{label}</p>
      <div className="rigburrito-stat-value-row">
        <p className="rigburrito-stat-value">{value}</p>
        {showSparkline && hasTrend && (
          <StatSparkline positive={positive} />
        )}
      </div>
      {hasTrend && (
        <div className={`rigburrito-trend ${positive ? 'rigburrito-trend--positive' : 'rigburrito-trend--negative'}`}>
          {positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          <span>{Math.abs(trendPct!)}%</span>
          <span className="rigburrito-caption">vs last month</span>
        </div>
      )}
    </div>
  )
}
