import EmailLayout, { EmailButton, EmailParagraph, emailInlineLinkStyle } from '../components/EmailLayout'
import { Link } from '@react-email/components'

interface WelcomeProps {
  firstName?: string | null
  browseUrl: string
  dashboardUrl: string
}

export default function Welcome({ firstName, browseUrl, dashboardUrl }: WelcomeProps) {
  const greeting = firstName?.trim()
    ? `Welcome to Black Diamond Marketplace, ${firstName.trim()}!`
    : 'Welcome to Black Diamond Marketplace!'

  return (
    <EmailLayout
      preview="Welcome to Black Diamond Marketplace"
      title={greeting}
    >
      <EmailParagraph>
        Your account is confirmed and ready. Black Diamond Marketplace connects buyers and
        sellers of heavy equipment — excavators, haul trucks, drill rigs, and more — across
        energy, construction, mining, and agriculture.
      </EmailParagraph>
      <EmailParagraph>
        Here&apos;s a good place to start: browse live equipment listings, or head to your
        dashboard when you&apos;re ready to list your own.
      </EmailParagraph>
      <EmailButton href={browseUrl}>Browse equipment</EmailButton>
      <EmailParagraph>
        Prefer to sell? Open your{' '}
        <Link href={dashboardUrl} style={emailInlineLinkStyle} className="email-orange-link">
          account dashboard
        </Link>{' '}
        to create a listing anytime.
      </EmailParagraph>
    </EmailLayout>
  )
}
