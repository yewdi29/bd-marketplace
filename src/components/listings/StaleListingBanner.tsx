'use client'

interface StaleListingBannerProps {
  onRelist: () => void
  onMarkSold: () => void
  relistLoading?: boolean
  soldLoading?: boolean
}

export default function StaleListingBanner({
  onRelist,
  onMarkSold,
  relistLoading = false,
  soldLoading = false,
}: StaleListingBannerProps) {
  return (
    <div
      className="mb-2 rounded-[8px] border px-2.5 py-2"
      style={{ background: '#FEF6EC', borderColor: '#FCE4C6' }}
      onClick={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
      onTouchStart={e => e.stopPropagation()}
    >
      <p className="text-[11px] font-semibold text-ink leading-snug">
        Is this listing still available?
      </p>
      <div className="mt-1.5 flex gap-1.5">
        <button
          type="button"
          onClick={onRelist}
          disabled={relistLoading || soldLoading}
          className="flex-1 py-1 text-[11px] font-semibold rounded-pill border transition-colors disabled:opacity-50"
          style={{
            background: '#FFFFFF',
            borderColor: '#FCE4C6',
            color: '#1A1D20',
          }}
        >
          {relistLoading ? 'Relisting…' : 'Relist'}
        </button>
        <button
          type="button"
          onClick={onMarkSold}
          disabled={relistLoading || soldLoading}
          className="flex-1 py-1 text-[11px] font-semibold rounded-pill border transition-colors disabled:opacity-50"
          style={{
            background: '#FFFFFF',
            borderColor: '#E8E9EA',
            color: '#4A4D52',
          }}
        >
          {soldLoading ? 'Updating…' : 'Mark as sold'}
        </button>
      </div>
    </div>
  )
}
