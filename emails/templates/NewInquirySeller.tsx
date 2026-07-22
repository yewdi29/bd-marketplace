import { Column, Link, Row, Section, Text } from '@react-email/components'
import React, { type ReactNode } from 'react'
import EmailLayout, {
  EmailButton,
  EmailParagraph,
  emailColors,
  emailFontFamily,
  emailInlineLinkStyle,
} from '../components/EmailLayout'

type InquiryTrustLabel = 'verified_member' | 'unverified_free'

const CONTENT_RISK_WARNING_THRESHOLD = 60

const cardStyle = {
  backgroundColor: '#F6F7F8',
  border: '1px solid #ECEDEF',
  borderRadius: '10px',
  margin: '0 0 24px',
  overflow: 'hidden' as const,
}

const fieldRowStyle = {
  borderBottom: '1px solid #E7E8EA',
  padding: '16px 20px',
}

const fieldRowLastStyle = {
  padding: '16px 20px',
}

const fieldLabelStyle = {
  color: '#8A8D92',
  fontFamily: emailFontFamily,
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.08em',
  lineHeight: '1.4',
  margin: '0 0 6px',
  textTransform: 'uppercase' as const,
}

const fieldValueStyle = {
  color: '#1E2023',
  fontFamily: emailFontFamily,
  fontSize: '15px',
  fontWeight: 400,
  lineHeight: '1.55',
  margin: 0,
  whiteSpace: 'pre-wrap' as const,
}

const listingLinkStyle = {
  color: emailColors.orange,
  fontWeight: 700,
  textDecoration: 'none',
} as const

interface NewInquirySellerProps {
  listingTitle: string
  buyerName: string
  buyerEmail: string
  buyerCompany?: string | null
  buyerPhone?: string | null
  buyerMessage: string
  listingUrl: string
  showVerification?: boolean
  trustLabel: InquiryTrustLabel
  buyerTierAtSubmission: string
  contentRiskScore: number
  contentRiskFlagSummary: string
  agentReasoning: string
}

function StatusIcon({ symbol, backgroundColor }: { symbol: string; backgroundColor: string }) {
  return (
    <Text
      style={{
        backgroundColor,
        borderRadius: '999px',
        color: '#FFFFFF',
        display: 'inline-block',
        fontFamily: emailFontFamily,
        fontSize: '13px',
        fontWeight: 700,
        height: '22px',
        lineHeight: '22px',
        margin: 0,
        textAlign: 'center' as const,
        width: '22px',
      }}
    >
      {symbol}
    </Text>
  )
}

function VerifiedStatusRow() {
  return (
    <Section
      style={{
        backgroundColor: '#EEFBF3',
        borderBottom: '1px solid #DBF3E4',
        padding: '14px 20px',
      }}
    >
      <Row>
        <Column style={{ width: '34px', verticalAlign: 'top' }}>
          <StatusIcon symbol="✓" backgroundColor="#16A34A" />
        </Column>
        <Column>
          <Text
            style={{
              color: '#14532D',
              fontFamily: emailFontFamily,
              fontSize: '14px',
              fontWeight: 700,
              lineHeight: '1.4',
              margin: '0 0 4px',
            }}
          >
            Verified Member
          </Text>
          <Text
            style={{
              color: '#1F5A38',
              fontFamily: emailFontFamily,
              fontSize: '13px',
              fontWeight: 400,
              lineHeight: '1.5',
              margin: 0,
            }}
          >
            This buyer holds an active membership.
          </Text>
        </Column>
      </Row>
    </Section>
  )
}

function UnverifiedStatusRow() {
  return (
    <Section
      style={{
        backgroundColor: '#FFF8ED',
        borderBottom: '1px solid #F6E9CE',
        padding: '14px 20px',
      }}
    >
      <Row>
        <Column style={{ width: '34px', verticalAlign: 'top' }}>
          <StatusIcon symbol="!" backgroundColor="#D97706" />
        </Column>
        <Column>
          <Text
            style={{
              color: '#7C2D12',
              fontFamily: emailFontFamily,
              fontSize: '14px',
              fontWeight: 700,
              lineHeight: '1.4',
              margin: '0 0 4px',
            }}
          >
            Unverified Member
          </Text>
          <Text
            style={{
              color: '#8A4A16',
              fontFamily: emailFontFamily,
              fontSize: '13px',
              fontWeight: 400,
              lineHeight: '1.5',
              margin: 0,
            }}
          >
            Buyer holds a free account. Proceed with caution.
          </Text>
        </Column>
      </Row>
    </Section>
  )
}

function RiskStatusRow({
  contentRiskFlagSummary,
  agentReasoning,
}: {
  contentRiskFlagSummary: string
  agentReasoning: string
}) {
  const subtext = [contentRiskFlagSummary, agentReasoning].filter(Boolean).join(' ')

  return (
    <Section
      style={{
        backgroundColor: '#FEF1F1',
        borderBottom: '1px solid #FADADA',
        padding: '14px 20px',
      }}
    >
      <Row>
        <Column style={{ width: '34px', verticalAlign: 'top' }}>
          <StatusIcon symbol="⚠" backgroundColor="#DC2626" />
        </Column>
        <Column>
          <Text
            style={{
              color: '#7F1D1D',
              fontFamily: emailFontFamily,
              fontSize: '14px',
              fontWeight: 700,
              lineHeight: '1.4',
              margin: '0 0 4px',
            }}
          >
            Caution advised
          </Text>
          <Text
            style={{
              color: '#8F2323',
              fontFamily: emailFontFamily,
              fontSize: '13px',
              fontWeight: 400,
              lineHeight: '1.5',
              margin: 0,
            }}
          >
            {subtext}
          </Text>
        </Column>
      </Row>
    </Section>
  )
}

function FieldRow({
  label,
  children,
  isLast = false,
}: {
  label: string
  children: ReactNode
  isLast?: boolean
}) {
  return (
    <Section style={isLast ? fieldRowLastStyle : fieldRowStyle}>
      <Text style={fieldLabelStyle}>{label}</Text>
      <Text style={fieldValueStyle}>{children}</Text>
    </Section>
  )
}

export default function NewInquirySeller({
  listingTitle,
  buyerName,
  buyerEmail,
  buyerCompany,
  buyerPhone,
  buyerMessage,
  listingUrl,
  showVerification = true,
  trustLabel,
  contentRiskScore,
  contentRiskFlagSummary,
  agentReasoning,
}: NewInquirySellerProps) {
  const company = buyerCompany?.trim() || null
  const phone = buyerPhone?.trim() || null
  const telHref = phone ? `tel:${phone.replace(/[^\d+]/g, '')}` : null
  const showRiskRow = showVerification && contentRiskScore >= CONTENT_RISK_WARNING_THRESHOLD

  const fieldRows: { label: string; content: ReactNode }[] = [
    { label: 'FROM', content: buyerName },
    {
      label: 'EMAIL',
      content: (
        <Link href={`mailto:${buyerEmail}`} style={emailInlineLinkStyle}>
          {buyerEmail}
        </Link>
      ),
    },
  ]

  if (phone && telHref) {
    fieldRows.push({
      label: 'PHONE',
      content: (
        <Link href={telHref} style={emailInlineLinkStyle}>
          {phone}
        </Link>
      ),
    })
  }

  if (company) {
    fieldRows.push({ label: 'COMPANY', content: company })
  }

  fieldRows.push({ label: 'MESSAGE', content: buyerMessage })

  return (
    <EmailLayout
      preview={`New inquiry on "${listingTitle}"`}
      title="New inquiry on your listing"
    >
      <EmailParagraph>
        You have a new inquiry from <strong>{buyerName}</strong> on{' '}
        <Link href={listingUrl} style={listingLinkStyle}>
          {listingTitle}
        </Link>
        .
      </EmailParagraph>

      <Section style={cardStyle}>
        {showVerification ? (
          trustLabel === 'verified_member' ? (
            <VerifiedStatusRow />
          ) : (
            <UnverifiedStatusRow />
          )
        ) : null}

        {showRiskRow ? (
          <RiskStatusRow
            contentRiskFlagSummary={contentRiskFlagSummary}
            agentReasoning={agentReasoning}
          />
        ) : null}

        {fieldRows.map((row, index) => (
          <FieldRow
            key={row.label}
            label={row.label}
            isLast={index === fieldRows.length - 1}
          >
            {row.content}
          </FieldRow>
        ))}
      </Section>

      <EmailButton href={listingUrl}>View listing</EmailButton>
    </EmailLayout>
  )
}
