import type { MembershipPlan } from '@/lib/types/database'

// ─── Plan badge ────────────────────────────────────────────────────────────────
// Reusable membership plan pill. Use ONLY in the profile dropdown and the
// account settings membership section — never on any public-facing page.

interface PlanStyle {
  background: string
  border: string
  color: string
  diamond: string
  label: string
  showDiamond: boolean
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

export default function PlanBadge({ plan }: { plan: MembershipPlan }) {
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
