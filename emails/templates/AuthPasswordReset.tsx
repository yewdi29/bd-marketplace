import EmailLayout, { EmailButton, EmailParagraph } from '../components/EmailLayout'

interface AuthPasswordResetProps {
  resetUrl: string
}

export default function AuthPasswordReset({ resetUrl }: AuthPasswordResetProps) {
  return (
    <EmailLayout
      preview="Reset your Black Diamond Marketplace password"
      title="Reset your password"
    >
      <EmailParagraph>
        We received a request to reset the password for your Black Diamond Marketplace account.
        Click the button below to choose a new password.
      </EmailParagraph>
      <EmailButton href={resetUrl}>Reset password</EmailButton>
      <EmailParagraph>
        If you didn&apos;t request this, you can safely ignore this email.
      </EmailParagraph>
    </EmailLayout>
  )
}
