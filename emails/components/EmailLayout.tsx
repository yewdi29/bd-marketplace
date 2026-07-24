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

/** Native dimensions from public/bd_logo-black.svg (viewBox 244×29). */
export const EMAIL_LOGO_NATURAL_WIDTH = 244
export const EMAIL_LOGO_NATURAL_HEIGHT = 29
export const EMAIL_LOGO_DISPLAY_HEIGHT = 27
export const EMAIL_LOGO_DISPLAY_WIDTH = Math.round(
  EMAIL_LOGO_DISPLAY_HEIGHT * (EMAIL_LOGO_NATURAL_WIDTH / EMAIL_LOGO_NATURAL_HEIGHT),
)

/** Same wordmark as site navbar — served from /public at deploy time. */
export const EMAIL_LOGO_URL = 'https://blackdiamondmkt.com/bd_logo-black.svg'

export const emailFontFamily =
  'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'

/** Matches container max-width — standard email mobile breakpoint for this system. */
export const EMAIL_MOBILE_BREAKPOINT = '600px'

export const emailInlineLinkStyle = {
  color: emailColors.orange,
  textDecoration: 'underline',
} as const

/** Orange inline text link with bold weight (e.g. listing title in summary lines). */
export const emailOrangeLinkBoldStyle = {
  color: emailColors.orange,
  fontWeight: 700,
  textDecoration: 'underline',
} as const

/** Canonical support contact for all transactional email footers. */
export const EMAIL_SUPPORT_ADDRESS = 'support@blackdiamondmkt.com'

interface EmailLayoutProps {
  preview: string
  title: string
  children: ReactNode
}

export default function EmailLayout({ preview, title, children }: EmailLayoutProps) {
  return (
    <Html>
      <Head>
        <style>
          {`
            @media only screen and (max-width: ${EMAIL_MOBILE_BREAKPOINT}) {
              .email-body {
                background-color: ${emailColors.white} !important;
                padding: 0 !important;
              }
              .email-container {
                max-width: 100% !important;
                width: 100% !important;
                margin: 0 !important;
                border-radius: 0 !important;
              }
            }
            a.email-orange-link {
              text-decoration: underline !important;
            }
            a.email-button {
              text-decoration: none !important;
            }
          `}
        </style>
      </Head>
      <Preview>{preview}</Preview>
      <Body style={bodyStyle} className="email-body">
        <Container style={containerStyle} className="email-container">
          <Section style={logoSectionStyle}>
            <Img
              src={EMAIL_LOGO_URL}
              alt="Black Diamond Marketplace"
              width={EMAIL_LOGO_DISPLAY_WIDTH}
              height={EMAIL_LOGO_DISPLAY_HEIGHT}
              style={logoImageStyle}
            />
          </Section>

          <Heading style={headingStyle}>{title}</Heading>

          <Section style={contentStyle}>{children}</Section>

          <Hr style={hrStyle} />
          <Text style={footerStyle}>
            Black Diamond Marketplace
            <br />
            <Link href="https://blackdiamondmkt.com" style={footerLinkStyle} className="email-orange-link">
              blackdiamondmkt.com
            </Link>
            <br />
            <Link href={`mailto:${EMAIL_SUPPORT_ADDRESS}`} style={footerLinkStyle} className="email-orange-link">
              {EMAIL_SUPPORT_ADDRESS}
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
    <Link href={href} style={buttonStyle} className="email-button">
      {children}
    </Link>
  )
}

/** Bordered content card for quoted text (e.g. admin feedback). */
export function EmailFeedbackBlock({ children }: { children: ReactNode }) {
  return (
    <Section style={cardStyle}>
      <Text style={cardBodyStyle}>{children}</Text>
    </Section>
  )
}

/** Unified FROM + MESSAGE card for seller inquiry notifications. */
export function EmailInquiryCard({
  buyerName,
  buyerEmail,
  buyerCompany,
  buyerPhone,
  message,
}: {
  buyerName: string
  buyerEmail: string
  buyerCompany?: string | null
  buyerPhone?: string | null
  message: string
}) {
  const company = buyerCompany?.trim() || null
  const phone = buyerPhone?.trim() || null
  const telHref = phone ? `tel:${phone.replace(/[^\d+]/g, '')}` : null

  return (
    <Section style={cardStyle}>
      <Text style={metaLabelStyle}>FROM</Text>
      <Text style={cardRowStyle}>{buyerName}</Text>
      {company && <Text style={cardRowStyle}>{company}</Text>}
      <Text style={phone ? cardRowStyle : cardRowLastStyle}>
        <Link href={`mailto:${buyerEmail}`} style={emailInlineLinkStyle} className="email-orange-link">
          {buyerEmail}
        </Link>
      </Text>
      {phone && telHref && (
        <Text style={cardRowLastStyle}>
          <Link href={telHref} style={emailInlineLinkStyle} className="email-orange-link">
            {phone}
          </Link>
        </Text>
      )}

      <Hr style={cardDividerStyle} />

      <Text style={metaLabelStyle}>MESSAGE</Text>
      <Text style={messageBodyStyle}>{message}</Text>
    </Section>
  )
}

const bodyStyle = {
  backgroundColor: emailColors.bg,
  fontFamily: emailFontFamily,
  margin: 0,
  padding: '32px 16px',
}

const containerStyle = {
  backgroundColor: emailColors.white,
  borderRadius: '12px',
  margin: '0 auto',
  maxWidth: '600px',
  padding: '40px 32px',
}

const logoSectionStyle = {
  marginBottom: '28px',
  paddingTop: '4px',
}

const logoImageStyle = {
  display: 'block',
  width: `${EMAIL_LOGO_DISPLAY_WIDTH}px`,
  height: 'auto',
  maxWidth: '100%',
}

const headingStyle = {
  color: emailColors.ink,
  fontFamily: emailFontFamily,
  fontSize: '22px',
  fontWeight: 600,
  lineHeight: '1.3',
  margin: '0 0 24px',
}

const contentStyle = {
  margin: 0,
}

const paragraphStyle = {
  color: emailColors.ink2,
  fontFamily: emailFontFamily,
  fontSize: '15px',
  fontWeight: 400,
  lineHeight: '1.65',
  margin: '0 0 20px',
}

const buttonStyle = {
  backgroundColor: emailColors.orange,
  borderRadius: '999px',
  color: emailColors.white,
  display: 'inline-block',
  fontFamily: emailFontFamily,
  fontSize: '14px',
  fontWeight: 600,
  marginTop: '4px',
  padding: '12px 24px',
  textDecoration: 'none',
}

const cardStyle = {
  backgroundColor: emailColors.feedbackBg,
  border: `1px solid ${emailColors.border}`,
  borderRadius: '10px',
  margin: '20px 0 0',
  padding: '20px 24px',
}

const metaLabelStyle = {
  color: emailColors.ink3,
  fontFamily: emailFontFamily,
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '0.08em',
  margin: '0 0 10px',
  textTransform: 'uppercase' as const,
}

const cardRowStyle = {
  color: emailColors.ink,
  fontFamily: emailFontFamily,
  fontSize: '15px',
  lineHeight: '1.5',
  margin: '0 0 6px',
}

const cardRowLastStyle = {
  color: emailColors.ink,
  fontFamily: emailFontFamily,
  fontSize: '15px',
  lineHeight: '1.5',
  margin: 0,
}

const cardBodyStyle = {
  color: emailColors.ink,
  fontFamily: emailFontFamily,
  fontSize: '15px',
  lineHeight: '1.65',
  margin: 0,
  whiteSpace: 'pre-wrap' as const,
}

const cardDividerStyle = {
  border: 'none',
  borderTop: `1px solid ${emailColors.border}`,
  margin: '18px 0',
}

const messageBodyStyle = {
  color: emailColors.ink,
  fontFamily: emailFontFamily,
  fontSize: '15px',
  lineHeight: '1.65',
  margin: 0,
  whiteSpace: 'pre-wrap' as const,
}

const hrStyle = {
  borderColor: emailColors.border,
  margin: '36px 0 20px',
}

const footerStyle = {
  color: emailColors.ink3,
  fontFamily: emailFontFamily,
  fontSize: '12px',
  lineHeight: '1.6',
  margin: 0,
}

const footerLinkStyle = {
  color: emailColors.orange,
  textDecoration: 'underline',
}
