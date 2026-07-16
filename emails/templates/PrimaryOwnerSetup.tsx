import EmailLayout, { EmailButton, EmailParagraph, emailInlineLinkStyle } from '../components/EmailLayout'
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
      preview={`Set up ${organizationName} on Black Diamond Enterprise`}
      title={`Welcome — set up ${organizationName}`}
    >
      <EmailParagraph>
        You&apos;ve been designated as the <strong>primary Owner</strong> of{' '}
        <strong>{organizationName}</strong> on Black Diamond Marketplace Enterprise.
      </EmailParagraph>
      <EmailParagraph>
        Accept this invitation to create your account (or sign in), then attach your
        payment method to activate billing. Your first step after accepting will be
        the billing setup flow.
      </EmailParagraph>
      <EmailParagraph>
        This invite expires in 7 days.
      </EmailParagraph>
      <EmailButton href={inviteUrl}>Accept &amp; set up billing</EmailButton>
      <EmailParagraph>
        Or copy this link:{' '}
        <Link href={inviteUrl} style={emailInlineLinkStyle}>
          {inviteUrl}
        </Link>
      </EmailParagraph>
    </EmailLayout>
  )
}
