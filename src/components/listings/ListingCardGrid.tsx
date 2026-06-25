interface ListingCardGridProps {
  children: React.ReactNode
  /** Dashboard uses 14px gap per design system; public pages use 16px. */
  gap?: 'public' | 'dashboard'
  className?: string
}

/** Fixed-column listing grid — 1 / 2 / 3 / 4 / 5 columns by breakpoint */
export default function ListingCardGrid({
  children,
  gap = 'public',
  className = '',
}: ListingCardGridProps) {
  return (
    <div
      className={`listing-card-grid${gap === 'dashboard' ? ' listing-card-grid--dashboard' : ''}${className ? ` ${className}` : ''}`}
    >
      {children}
    </div>
  )
}
