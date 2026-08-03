import EmailLayout, { EmailButton, EmailParagraph, emailInlineLinkStyle } from '../components/EmailLayout'
import { Link } from '@react-email/components'

interface OwnershipTransferCompletedProps {
  organizationName: string
  companySettingsUrl: string
}

export default function OwnershipTransferCompleted({
  organizationName,
  companySettingsUrl,
}: OwnershipTransferCompletedProps) {
  return (
    <EmailLayout
      preview={`You are now the primary owner of ${organizationName}`}
      title="Primary ownership transferred"
    >
      <EmailParagraph>
        You are now the <strong>primary owner</strong> of{' '}
        <strong>{organizationName}</strong> on Black Diamond Marketplace.
      </EmailParagraph>
      <EmailParagraph>
        As primary owner, you have full billing access and control of organization settings.
        The previous primary owner remains an Owner unless removed separately.
      </EmailParagraph>
      <EmailButton href={companySettingsUrl}>Open Company Settings</EmailButton>
      <EmailParagraph>
        Or copy this link:{' '}
        <Link href={companySettingsUrl} style={emailInlineLinkStyle} className="email-orange-link">
          {companySettingsUrl}
        </Link>
      </EmailParagraph>
    </EmailLayout>
  )
}
