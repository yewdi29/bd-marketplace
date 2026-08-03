import EmailLayout, { EmailButton, EmailParagraph } from '../components/EmailLayout'

interface AuthConfirmationProps {
  confirmationUrl: string
}

export default function AuthConfirmation({ confirmationUrl }: AuthConfirmationProps) {
  return (
    <EmailLayout
      preview="Confirm your email for Black Diamond Marketplace"
      title="Confirm your email"
    >
      <EmailParagraph>
        Thanks for signing up for Black Diamond Marketplace. Confirm your email address to
        activate your account and get started.
      </EmailParagraph>
      <EmailButton href={confirmationUrl}>Confirm email</EmailButton>
      <EmailParagraph>
        If you didn&apos;t create this account, you can safely ignore this email.
      </EmailParagraph>
    </EmailLayout>
  )
}
