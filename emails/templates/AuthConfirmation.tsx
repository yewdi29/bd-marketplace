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
        Thanks for signing up for Black Diamond Marketplace. Click below to continue, then
        confirm your email on the next page to activate your account and get started.
      </EmailParagraph>
      <EmailButton href={confirmationUrl}>Continue to Confirm Email</EmailButton>
      <EmailParagraph>
        This link expires in 1 hour. If you didn&apos;t create this account, you can safely
        ignore this email.
      </EmailParagraph>
    </EmailLayout>
  )
}
