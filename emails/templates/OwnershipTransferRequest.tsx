import EmailLayout, { EmailButton, EmailParagraph, emailInlineLinkStyle } from '../components/EmailLayout'
import { Link } from '@react-email/components'

interface OwnershipTransferRequestProps {
  organizationName: string
  currentOwnerName: string
  acceptUrl: string
}

export default function OwnershipTransferRequest({
  organizationName,
  currentOwnerName,
  acceptUrl,
}: OwnershipTransferRequestProps) {
  return (
    <EmailLayout
      preview={`Primary ownership transfer for ${organizationName}`}
      title="Primary ownership transfer request"
    >
      <EmailParagraph>
        <strong>{currentOwnerName}</strong> wants to transfer primary ownership of{' '}
        <strong>{organizationName}</strong> to you.
      </EmailParagraph>
      <EmailParagraph>
        Accepting makes you the primary owner with full billing access. The current
        primary owner will remain an Owner in the organization.
      </EmailParagraph>
      <EmailButton href={acceptUrl}>Review and accept</EmailButton>
      <EmailParagraph>
        Or copy this link:{' '}
        <Link href={acceptUrl} style={emailInlineLinkStyle} className="email-orange-link">
          {acceptUrl}
        </Link>
      </EmailParagraph>
    </EmailLayout>
  )
}
