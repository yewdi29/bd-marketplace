/** Matches planStyle / ENTERPRISE_MEMBERSHIP_STYLE in src/components/ui/PlanBadge.tsx */

export type EmailPlanId = 'free' | 'starter' | 'pro' | 'max' | 'premium' | 'enterprise'

const PLAN_BADGE_STYLES: Record<
  EmailPlanId,
  {
    background: string
    border: string
    color: string
    diamond: string
    label: string
    showDiamond: boolean
  }
> = {
  free: {
    background: '#F4F4F5',
    border: '#E4E4E7',
    color: '#71717A',
    diamond: '#71717A',
    label: 'Free',
    showDiamond: false,
  },
  starter: {
    background: '#efffcc',
    border: '#7ab82e',
    color: '#4a7a10',
    diamond: '#4a7a10',
    label: 'Starter',
    showDiamond: true,
  },
  pro: {
    background: '#dffbfd',
    border: '#4ab8c4',
    color: '#1a7a85',
    diamond: '#1a7a85',
    label: 'Pro',
    showDiamond: true,
  },
  max: {
    background: '#f6d9f5',
    border: '#c472c2',
    color: '#7a3579',
    diamond: '#7a3579',
    label: 'Max',
    showDiamond: true,
  },
  premium: {
    background: '#f6d9f5',
    border: '#c472c2',
    color: '#7a3579',
    diamond: '#7a3579',
    label: 'Premium',
    showDiamond: true,
  },
  enterprise: {
    background: '#E6F0FF',
    border: '#B3D1FF',
    color: '#004499',
    diamond: '#004499',
    label: 'Enterprise',
    showDiamond: true,
  },
}

export default function EmailPlanBadge({ plan }: { plan: EmailPlanId }) {
  const style = PLAN_BADGE_STYLES[plan]

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: style.background,
        border: `1px solid ${style.border}`,
        color: style.color,
        borderRadius: 999,
        padding: '3px 10px',
        fontSize: 12,
        fontWeight: 500,
        marginBottom: 16,
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
