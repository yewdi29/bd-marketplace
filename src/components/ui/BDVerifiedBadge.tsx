import type { MembershipPlan } from '@/lib/types/database'

interface BDVerifiedBadgeProps {
  plan: MembershipPlan
  size?: 'sm' | 'md' | 'lg'
}

// Size map: [iconWH, wrapperWH]
const sizeMap = {
  sm: { icon: 14, wrapper: 18 },   // inline — next to company name in cards
  md: { icon: 18, wrapper: 24 },   // card context
  lg: { icon: 28, wrapper: 36 },   // hero / profile header
}

/**
 * Brilliant-cut diamond badge indicating a verified BD seller.
 * Only renders for non-free plan users. Never exposes the actual tier.
 * Tooltip on hover: "BD Verified Seller"
 */
export default function BDVerifiedBadge({ plan, size = 'md' }: BDVerifiedBadgeProps) {
  // Free plan users do not receive this badge
  if (plan === 'free') return null

  const { icon, wrapper } = sizeMap[size]

  return (
    <span
      className="relative inline-flex items-center justify-center group shrink-0"
      style={{ width: wrapper, height: wrapper }}
      aria-label="BD Verified Seller"
    >
      {/* Diamond SVG — brilliant cut with crown + pavilion facets */}
      <svg
        width={icon}
        height={Math.round(icon * 1.2)}
        viewBox="0 0 20 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Full kite base — main pavilion orange */}
        <path d="M10 1L1 9L10 23.5L19 9L10 1Z" fill="#FF6B35" />
        {/* Crown overlay — lighter orange for the crown facets */}
        <path d="M10 1L1 9L19 9Z" fill="#FF8C5A" />
        {/* Crown table facet — inner triangle gives depth */}
        <path d="M10 2L6.5 9L13.5 9Z" fill="#FF6B35" fillOpacity="0.55" />
        {/* Girdle line — subtle separator between crown and pavilion */}
        <line x1="1" y1="9" x2="19" y2="9" stroke="#E85A1E" strokeWidth="0.4" />
      </svg>

      {/* Tooltip */}
      <span
        className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5
          whitespace-nowrap bg-ink text-white font-sans text-[11px] font-medium
          px-2.5 py-1 rounded-pill opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10"
        style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.20)' }}
      >
        BD Verified Seller
      </span>
    </span>
  )
}
