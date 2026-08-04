import EmailLayout, { EmailButton, EmailParagraph, emailInlineLinkStyle } from '../components/EmailLayout'
import EmailPlanBadge from '../components/EmailPlanBadge'
import { Link } from '@react-email/components'

interface PrimaryOwnerSetupProps {
  organizationName: string
  inviteUrl: string
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
      <EmailPlanBadge plan="enterprise" />
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
        <Link href={inviteUrl} style={emailInlineLinkStyle} className="email-orange-link">
          {inviteUrl}
        </Link>
      </EmailParagraph>
    </EmailLayout>
  )
}
