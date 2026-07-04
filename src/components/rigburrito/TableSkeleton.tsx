interface TableSkeletonProps {
  rows?: number
  cols?: number
}

export default function TableSkeleton({ rows = 5, cols = 6 }: TableSkeletonProps) {
  return (
    <div className="rigburrito-table-wrap">
      <div className="rigburrito-skeleton" style={{ height: 40, borderRadius: 0 }} />
      <div style={{ padding: '0 16px' }}>
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4" style={{ height: 52 }}>
            {Array.from({ length: cols }).map((_, c) => (
              <div
                key={c}
                className="rigburrito-skeleton"
                style={{ height: 12, flex: c === 0 ? '0 0 48px' : 1 }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
