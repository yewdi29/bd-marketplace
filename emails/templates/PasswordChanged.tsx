import EmailLayout, { EmailButton, EmailParagraph } from '../components/EmailLayout'

interface PasswordChangedProps {
  settingsUrl: string
}

/** Notification after a signed-in user changes their password in Account Settings. */
export default function PasswordChanged({ settingsUrl }: PasswordChangedProps) {
  return (
    <EmailLayout
      preview="Your Black Diamond Marketplace password was successfully changed"
      title="Password updated"
    >
      <EmailParagraph>
        Your Black Diamond Marketplace password was successfully changed.
      </EmailParagraph>
      <EmailButton href={settingsUrl}>Account Settings</EmailButton>
    </EmailLayout>
  )
}
