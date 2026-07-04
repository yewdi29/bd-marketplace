'use client'

import { Line, LineChart, ResponsiveContainer } from 'recharts'

interface StatSparklineProps {
  positive?: boolean
  data?: number[]
}

function defaultData(positive: boolean): { v: number }[] {
  const points = positive
    ? [2, 3, 2.5, 4, 3.5, 5, 4.5, 6]
    : [6, 5, 5.5, 4, 4.5, 3, 3.5, 2]
  return points.map(v => ({ v }))
}

export default function StatSparkline({ positive = true, data }: StatSparklineProps) {
  const chartData = data
    ? data.map(v => ({ v }))
    : defaultData(positive)

  return (
    <ResponsiveContainer width={80} height={32}>
      <LineChart data={chartData}>
        <Line
          type="monotone"
          dataKey="v"
          stroke={positive ? '#FF6B35' : '#DC2626'}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
