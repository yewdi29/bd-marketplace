import type { MembershipPlan } from '@/lib/types/database'

// ─── Plan badge ────────────────────────────────────────────────────────────────
// Reusable membership plan pill. Use in profile dropdown and account settings.
// PlanDiamondMark is also used on pricing/upgrade tier cards.

export const ENTERPRISE_MEMBERSHIP_STYLE = {
  background: '#E6F0FF',
  border: '#B3D1FF',
  color: '#004499',
  diamond: '#004499',
  label: 'Enterprise',
} as const

interface PlanStyle {
  background: string
  border: string
  color: string
  diamond: string
  label: string
  showDiamond: boolean
}

function diamondMarkStyle(style: Pick<PlanStyle, 'background' | 'border' | 'diamond'>) {
  return (
    <span
      className="inline-flex items-center justify-center shrink-0 rounded-full border"
      style={{
        width: 22,
        height: 22,
        background: style.background,
        borderColor: style.border,
      }}
      aria-hidden="true"
    >
      <svg width="8" height="8" viewBox="0 0 10 14">
        <polygon points="5,0 10,5 5,14 0,5" fill={style.diamond} />
      </svg>
    </span>
  )
}

function planStyle(plan: MembershipPlan): PlanStyle {
  switch (plan) {
    case 'starter':
      return {
        background: '#efffcc',
        border: '#7ab82e',
        color: '#4a7a10',
        diamond: '#4a7a10',
        label: 'Starter',
        showDiamond: true,
      }
    case 'pro':
      return {
        background: '#dffbfd',
        border: '#4ab8c4',
        color: '#1a7a85',
        diamond: '#1a7a85',
        label: 'Pro',
        showDiamond: true,
      }
    case 'max':
      return {
        background: '#f6d9f5',
        border: '#c472c2',
        color: '#7a3579',
        diamond: '#7a3579',
        label: 'Max',
        showDiamond: true,
      }
    case 'premium':
      // Legacy plan — treat with the Max styling
      return {
        background: '#f6d9f5',
        border: '#c472c2',
        color: '#7a3579',
        diamond: '#7a3579',
        label: 'Premium',
        showDiamond: true,
      }
    default: // free — existing default muted style, no change
      return {
        background: '#F4F4F5',
        border: '#E4E4E7',
        color: '#71717A',
        diamond: '#71717A',
        label: 'Free',
        showDiamond: false,
      }
  }
}

/** Colored diamond in a circle — matches profile dropdown plan indicator styling. */
export function EnterpriseDiamondMark() {
  return diamondMarkStyle(ENTERPRISE_MEMBERSHIP_STYLE)
}

export function PlanDiamondMark({ plan }: { plan: 'starter' | 'pro' | 'max' | 'enterprise' }) {
  if (plan === 'enterprise') return <EnterpriseDiamondMark />
  const style = planStyle(plan)
  return diamondMarkStyle(style)
}

export function EnterpriseBadge() {
  const style = ENTERPRISE_MEMBERSHIP_STYLE
  return (
    <span
      className="inline-flex items-center gap-1.5 border"
      style={{
        background: style.background,
        borderColor: style.border,
        color: style.color,
        borderRadius: 999,
        padding: '3px 10px',
        fontSize: 12,
        fontWeight: 500,
      }}
    >
      <svg width="8" height="8" viewBox="0 0 10 14" aria-hidden="true">
        <polygon points="5,0 10,5 5,14 0,5" fill={style.diamond} />
      </svg>
      {style.label}
    </span>
  )
}

export default function PlanBadge({
  plan,
  isEnterprise = false,
}: {
  plan: MembershipPlan
  isEnterprise?: boolean
}) {
  if (isEnterprise) return <EnterpriseBadge />

  const style = planStyle(plan)

  return (
    <span
      className="inline-flex items-center gap-1.5 border"
      style={{
        background: style.background,
        borderColor: style.border,
        color: style.color,
        borderRadius: 999,
        padding: '3px 10px',
        fontSize: 12,
        fontWeight: 500,
      }}
    >
      {style.showDiamond && (
        <svg width="8" height="8" viewBox="0 0 10 14" aria-hidden="true">
          <polygon points="5,0 10,5 5,14 0,5" fill={style.diamond} />
        </svg>
      )}
      {style.label}
    </span>
  )
}
