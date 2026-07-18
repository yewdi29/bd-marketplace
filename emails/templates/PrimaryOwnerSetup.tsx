import EmailLayout, { EmailButton, EmailParagraph, emailInlineLinkStyle } from '../components/EmailLayout'
import { Link } from '@react-email/components'

/** Matches ENTERPRISE_MEMBERSHIP_STYLE in src/components/ui/PlanBadge.tsx */
const ENTERPRISE_BADGE = {
  background: '#E6F0FF',
  border: '#B3D1FF',
  color: '#004499',
  diamond: '#004499',
  label: 'Enterprise',
} as const

interface PrimaryOwnerSetupProps {
  organizationName: string
  inviteUrl: string
}

function EmailEnterpriseBadge() {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: ENTERPRISE_BADGE.background,
        border: `1px solid ${ENTERPRISE_BADGE.border}`,
        color: ENTERPRISE_BADGE.color,
        borderRadius: 999,
        padding: '3px 10px',
        fontSize: 12,
        fontWeight: 500,
        marginBottom: 16,
      }}
    >
      <svg width="8" height="8" viewBox="0 0 10 14" aria-hidden="true">
        <polygon points="5,0 10,5 5,14 0,5" fill={ENTERPRISE_BADGE.diamond} />
      </svg>
      {ENTERPRISE_BADGE.label}
    </span>
  )
}

export default function PrimaryOwnerSetup({
  organizationName,
  inviteUrl,
}: PrimaryOwnerSetupProps) {
  return (
    <EmailLayout
      preview={`Welcome to Black Diamond Enterprise — set up ${organizationName}`}
      title="Welcome to Black Diamond Enterprise!"
    >
      <EmailEnterpriseBadge />
      <EmailParagraph>
        Congratulations — you&apos;ve been named the <strong>primary Owner</strong> of{' '}
        <strong>{organizationName}</strong> on Black Diamond Marketplace Enterprise.
      </EmailParagraph>
      <EmailParagraph>
        As primary Owner, you have full control of your organization: inviting your team,
        managing locations, and overseeing billing. Completing secure checkout through Stripe is
        the final step to activate your Enterprise account.
      </EmailParagraph>
      <EmailParagraph>
        Click below to accept your invitation, review your plan, and complete secure checkout
        through Stripe.
      </EmailParagraph>
      <EmailParagraph>
        This invite expires in 7 days.
      </EmailParagraph>
      <EmailButton href={inviteUrl}>Accept &amp; Continue to Checkout</EmailButton>
      <EmailParagraph>
        Or copy this link:{' '}
        <Link href={inviteUrl} style={emailInlineLinkStyle}>
          {inviteUrl}
        </Link>
      </EmailParagraph>
    </EmailLayout>
  )
}
