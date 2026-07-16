import EmailLayout, { EmailButton, EmailParagraph, emailInlineLinkStyle } from '../components/EmailLayout'
import { Link } from '@react-email/components'

interface OrgInviteProps {
  organizationName: string
  role: 'owner' | 'manager'
  teamTag: string[] | null
  inviteUrl: string
  inviterName: string
}

function formatLocationList(locations: string[] | null): string | null {
  if (!locations?.length) return null
  return locations.join(', ')
}

export default function OrgInvite({
  organizationName,
  role,
  teamTag,
  inviteUrl,
  inviterName,
}: OrgInviteProps) {
  const roleLabel = role === 'owner' ? 'Owner' : 'Manager'
  const locationLine = role === 'manager' && teamTag?.length
    ? ` You'll be assigned to: ${formatLocationList(teamTag)}.`
    : ''

  return (
    <EmailLayout
      preview={`Join ${organizationName} on Black Diamond Marketplace`}
      title={`You're invited to join ${organizationName}`}
    >
      <EmailParagraph>
        <strong>{inviterName}</strong> invited you to join{' '}
        <strong>{organizationName}</strong> as an organization {roleLabel}.{locationLine}
      </EmailParagraph>
      <EmailParagraph>
        This invite expires in 7 days. Accept to access your team&apos;s listings and
        organization tools in Company Settings.
      </EmailParagraph>
      <EmailButton href={inviteUrl}>Accept invitation</EmailButton>
      <EmailParagraph>
        Or copy this link:{' '}
        <Link href={inviteUrl} style={emailInlineLinkStyle}>
          {inviteUrl}
        </Link>
      </EmailParagraph>
    </EmailLayout>
  )
}
