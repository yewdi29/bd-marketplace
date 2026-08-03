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
        Click below to continue, then choose a new password on the next page.
      </EmailParagraph>
      <EmailButton href={resetUrl}>Continue to Reset Password</EmailButton>
      <EmailParagraph>
        This link expires in 1 hour. If you didn&apos;t request this, you can safely ignore
        this email.
      </EmailParagraph>
    </EmailLayout>
  )
}
