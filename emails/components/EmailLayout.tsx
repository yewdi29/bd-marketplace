import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
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
            <table cellPadding={0} cellSpacing={0} role="presentation">
              <tbody>
                <tr>
                  <td style={logoMarkStyle} />
                  <td style={wordmarkCellStyle}>
                    <Text style={wordmarkStyle}>BLACK DIAMOND</Text>
                  </td>
                </tr>
              </tbody>
            </table>
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

const logoMarkStyle = {
  width: '28px',
  height: '28px',
  borderRadius: '7px',
  backgroundColor: emailColors.ink,
}

const wordmarkCellStyle = {
  paddingLeft: '10px',
  verticalAlign: 'middle',
}

const wordmarkStyle = {
  color: emailColors.ink,
  fontSize: '13px',
  fontWeight: 700,
  letterSpacing: '0.04em',
  margin: 0,
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
