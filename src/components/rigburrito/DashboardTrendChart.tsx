'use client'

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { MetricHistoryPoint } from '@/lib/rigburrito/dashboardHistory'

interface DashboardTrendChartProps {
  title: string
  data: MetricHistoryPoint[]
  valueFormatter?: (value: number) => string
  note?: string
}

export default function DashboardTrendChart({
  title,
  data,
  valueFormatter = v => String(v),
  note,
}: DashboardTrendChartProps) {
  return (
    <div className="rigburrito-detail-region">
      <div className="rigburrito-detail-region-header">
        <h2 className="rigburrito-section-title">{title}</h2>
        {note && <p className="rigburrito-caption">{note}</p>}
      </div>
      <div className="rigburrito-trend-chart">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#F0F1F3" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#6B7280' }}
              axisLine={{ stroke: '#F0F1F3' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#6B7280', fontFamily: 'var(--font-dm-mono)' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={valueFormatter}
              width={56}
            />
            <Tooltip
              contentStyle={{
                border: '1px solid #F0F1F3',
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value) => [valueFormatter(Number(value ?? 0)), title]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#FF6B35"
              strokeWidth={2}
              dot={{ r: 3, fill: '#FF6B35', strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
