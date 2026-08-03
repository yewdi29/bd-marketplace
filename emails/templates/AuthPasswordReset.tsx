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
        Click the link below to set a new password for your Black Diamond Marketplace account.
        This link expires in 15 minutes.
      </EmailParagraph>
      <EmailButton href={resetUrl}>Reset Password</EmailButton>
      <EmailParagraph>
        If you didn&apos;t request this, you can safely ignore this email.
      </EmailParagraph>
    </EmailLayout>
  )
}
