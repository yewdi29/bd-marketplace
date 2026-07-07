interface StatusBadgeProps {
  status: string
  variant?: 'listing' | 'article' | 'deal'
}

interface BadgeColors {
  text: string
  bg: string
  border: string
}

const STATUS_COLORS: Record<string, BadgeColors> = {
  active: { text: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
  published: { text: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
  sold: { text: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
  closed_won: { text: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
  pending_review: { text: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  yellow: { text: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  negotiating: { text: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  removed: { text: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
  red: { text: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
  closed_lost: { text: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
  draft: { text: '#6B7280', bg: '#F9FAFB', border: '#E5E7EB' },
  archived: { text: '#6B7280', bg: '#F9FAFB', border: '#E5E7EB' },
  identified: { text: '#6B7280', bg: '#F9FAFB', border: '#E5E7EB' },
  contacted: { text: '#6B7280', bg: '#F9FAFB', border: '#E5E7EB' },
  new: { text: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
  forwarded: { text: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
  denied: { text: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
  commission_opportunity: { text: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  green: { text: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
}

const NEUTRAL: BadgeColors = { text: '#6B7280', bg: '#F9FAFB', border: '#E5E7EB' }

export default function StatusBadge({ status, variant = 'listing' }: StatusBadgeProps) {
  const colors = STATUS_COLORS[status] ?? NEUTRAL
  const label = status.replace(/_/g, ' ')
  return (
    <span
      className="inline-block capitalize"
      style={{
        borderRadius: 999,
        padding: '2px 8px',
        fontSize: 11,
        fontWeight: 500,
        color: colors.text,
        background: colors.bg,
        border: `1px solid ${colors.border}`,
      }}
    >
      {variant === 'deal' && status === 'negotiating' ? 'In Negotiation' : label}
    </span>
  )
}
