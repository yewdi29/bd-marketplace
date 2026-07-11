import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { ReactNode } from 'react'

export const emailColors = {
  ink: '#1A1D20',
  ink2: '#4A4D52',
  ink3: '#9A9DA2',
  orange: '#FF6B35',
  bg: '#F7F8F9',
  white: '#FFFFFF',
  border: '#E8E9EA',
  feedbackBg: '#F8F9FA',
} as const

/** Same wordmark as site navbar — served from /public at deploy time. */
export const EMAIL_LOGO_URL = 'https://www.blackdiamondmkt.com/bd_logo-black.svg'

export const emailInlineLinkStyle = {
  color: emailColors.orange,
  textDecoration: 'underline',
} as const

interface EmailLayoutProps {
  preview: string
  title: string
  children: ReactNode
}

export default function EmailLayout({ preview, title, children }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section style={logoSectionStyle}>
            <Img
              src={EMAIL_LOGO_URL}
              alt="Black Diamond Marketplace"
              width={140}
              height={27}
              style={logoImageStyle}
            />
          </Section>

          <Heading style={headingStyle}>{title}</Heading>

          <Section style={contentStyle}>{children}</Section>

          <Hr style={hrStyle} />
          <Text style={footerStyle}>
            Black Diamond Marketplace
            <br />
            <Link href="https://blackdiamondmkt.com" style={footerLinkStyle}>
              blackdiamondmkt.com
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export function EmailParagraph({ children }: { children: ReactNode }) {
  return <Text style={paragraphStyle}>{children}</Text>
}

export function EmailButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} style={buttonStyle}>
      {children}
    </Link>
  )
}

export function EmailFeedbackBlock({ children }: { children: ReactNode }) {
  return (
    <Section style={feedbackBlockStyle}>
      <Text style={feedbackTextStyle}>{children}</Text>
    </Section>
  )
}

export function EmailFromBlock({
  buyerName,
  buyerEmail,
  buyerCompany,
  buyerPhone,
}: {
  buyerName: string
  buyerEmail: string
  buyerCompany?: string | null
  buyerPhone?: string | null
}) {
  const company = buyerCompany?.trim() || null
  const phone = buyerPhone?.trim() || null
  const telHref = phone ? `tel:${phone.replace(/[^\d+]/g, '')}` : null

  return (
    <Section style={fromBlockStyle}>
      <Text style={fromLabelStyle}>FROM</Text>
      <Text style={fromRowStyle}>{buyerName}</Text>
      {company && <Text style={fromRowStyle}>{company}</Text>}
      <Text style={phone ? fromRowStyle : fromRowLastStyle}>
        <Link href={`mailto:${buyerEmail}`} style={emailInlineLinkStyle}>
          {buyerEmail}
        </Link>
      </Text>
      {phone && telHref && (
        <Text style={fromRowLastStyle}>
          <Link href={telHref} style={emailInlineLinkStyle}>
            {phone}
          </Link>
        </Text>
      )}
    </Section>
  )
}

const bodyStyle = {
  backgroundColor: emailColors.bg,
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  margin: 0,
  padding: '24px 0',
}

const containerStyle = {
  backgroundColor: emailColors.white,
  border: `1px solid ${emailColors.border}`,
  borderRadius: '12px',
  margin: '0 auto',
  maxWidth: '600px',
  padding: '32px',
}

const logoSectionStyle = {
  marginBottom: '24px',
}

const logoImageStyle = {
  display: 'block',
  height: '27px',
  width: 'auto',
  maxWidth: '140px',
}

const headingStyle = {
  color: emailColors.ink,
  fontSize: '20px',
  fontWeight: 600,
  lineHeight: '1.3',
  margin: '0 0 20px',
}

const contentStyle = {
  margin: 0,
}

const paragraphStyle = {
  color: emailColors.ink2,
  fontSize: '14px',
  lineHeight: '1.7',
  margin: '0 0 16px',
}

const buttonStyle = {
  backgroundColor: emailColors.orange,
  borderRadius: '999px',
  color: emailColors.white,
  display: 'inline-block',
  fontSize: '14px',
  fontWeight: 600,
  marginTop: '8px',
  padding: '12px 24px',
  textDecoration: 'none',
}

const feedbackBlockStyle = {
  backgroundColor: emailColors.feedbackBg,
  borderLeft: `4px solid ${emailColors.orange}`,
  borderRadius: '8px',
  margin: '16px 0',
  padding: '16px 20px',
}

const feedbackTextStyle = {
  color: emailColors.ink,
  fontSize: '14px',
  lineHeight: '1.7',
  margin: 0,
  whiteSpace: 'pre-wrap' as const,
}

const fromBlockStyle = {
  backgroundColor: emailColors.white,
  border: `1px solid ${emailColors.border}`,
  borderRadius: '8px',
  margin: '16px 0',
  padding: '16px 20px',
}

const fromLabelStyle = {
  color: emailColors.ink3,
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '0.08em',
  margin: '0 0 10px',
  textTransform: 'uppercase' as const,
}

const fromRowStyle = {
  color: emailColors.ink,
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0 0 6px',
}

const fromRowLastStyle = {
  color: emailColors.ink,
  fontSize: '14px',
  lineHeight: '1.5',
  margin: 0,
}

const hrStyle = {
  borderColor: emailColors.border,
  margin: '32px 0 16px',
}

const footerStyle = {
  color: emailColors.ink3,
  fontSize: '12px',
  lineHeight: '1.6',
  margin: 0,
}

const footerLinkStyle = {
  color: emailColors.orange,
  textDecoration: 'none',
}
