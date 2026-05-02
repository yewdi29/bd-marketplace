import { ListingTier } from '@/lib/types/database'
import { getTierLabel } from '@/lib/utils'

interface TierBadgeProps {
  tier: ListingTier
  showLabel?: boolean
  size?: 'sm' | 'md'
}

const tierStyles: Record<ListingTier, string> = {
  green: 'bg-tier-green/10 border-tier-green/40 text-tier-green',
  yellow: 'bg-tier-yellow/10 border-tier-yellow/40 text-tier-yellow',
  red: 'bg-tier-red/10 border-tier-red/40 text-tier-red',
}

const dotStyles: Record<ListingTier, string> = {
  green: 'bg-tier-green',
  yellow: 'bg-tier-yellow',
  red: 'bg-tier-red',
}

export default function TierBadge({ tier, showLabel = false, size = 'sm' }: TierBadgeProps) {
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'

  return (
    <span className={`inline-flex items-center gap-1.5 border font-body font-semibold ${tierStyles[tier]} ${sizeClass}`}>
      <span className={`w-2 h-2 rounded-full ${dotStyles[tier]}`} />
      {showLabel ? getTierLabel(tier) : tier.toUpperCase()}
    </span>
  )
}
