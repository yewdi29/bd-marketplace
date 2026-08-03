import { Section, Text } from '@react-email/components'
import EmailLayout, { EmailParagraph, emailColors, emailFontFamily } from '../components/EmailLayout'

interface AuthConfirmationProps {
  /** 6-digit OTP from Supabase email_data.token — displayed as plain text, not a link */
  otpCode: string
}

export default function AuthConfirmation({ otpCode }: AuthConfirmationProps) {
  return (
    <EmailLayout
      preview="Your Black Diamond Marketplace confirmation code"
      title="Confirm your account"
    >
      <EmailParagraph>
        Thanks for signing up for Black Diamond Marketplace. Enter this code on the signup page
        to activate your account:
      </EmailParagraph>

      <Section style={codeSectionStyle}>
        <Text style={codeStyle}>{otpCode}</Text>
      </Section>

      <EmailParagraph>
        This code expires in 15 minutes. If you didn&apos;t create this account, you can safely
        ignore this email.
      </EmailParagraph>
    </EmailLayout>
  )
}

const codeSectionStyle = {
  textAlign: 'center' as const,
  margin: '8px 0 24px',
}

const codeStyle = {
  margin: 0,
  fontFamily: emailFontFamily,
  fontSize: '36px',
  fontWeight: 700,
  letterSpacing: '0.28em',
  color: emailColors.ink,
  lineHeight: '1.2',
}
