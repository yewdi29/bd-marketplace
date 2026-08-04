import { Section, Text } from '@react-email/components'
import EmailLayout, {
  EmailButton,
  EmailParagraph,
  emailColors,
  emailFontFamily,
} from '../components/EmailLayout'
import EmailPlanBadge, { type EmailPlanId } from '../components/EmailPlanBadge'

interface SubscriptionConfirmedProps {
  firstName?: string | null
  planId: EmailPlanId
  planLabel: string
  billingPeriodLabel?: string | null
  features: string[]
  manageBillingUrl: string
}

export default function SubscriptionConfirmed({
  firstName,
  planId,
  planLabel,
  billingPeriodLabel,
  features,
  manageBillingUrl,
}: SubscriptionConfirmedProps) {
  const greeting = firstName?.trim() ? `Hi ${firstName.trim()},` : 'Hi there,'
  const periodNote = billingPeriodLabel ? ` (${billingPeriodLabel} billing)` : ''

  return (
    <EmailLayout
      preview={`You're now on the ${planLabel} plan`}
      title={`Welcome to ${planLabel}`}
    >
      <EmailPlanBadge plan={planId} />
      <EmailParagraph>{greeting}</EmailParagraph>
      <EmailParagraph>
        Your Black Diamond Marketplace membership is confirmed. You&apos;re now on the{' '}
        <strong>{planLabel}</strong> plan{periodNote}. Here&apos;s what&apos;s included:
      </EmailParagraph>

      {features.length > 0 && (
        <Section style={listSectionStyle}>
          {features.map(feature => (
            <Text key={feature} style={listItemStyle}>
              • {feature}
            </Text>
          ))}
        </Section>
      )}

      <EmailParagraph>
        You can update your payment method, change plans, or cancel anytime from billing
        management.
      </EmailParagraph>
      <EmailButton href={manageBillingUrl}>Manage billing</EmailButton>
    </EmailLayout>
  )
}

const listSectionStyle = {
  margin: '0 0 20px',
}

const listItemStyle = {
  color: emailColors.ink2,
  fontFamily: emailFontFamily,
  fontSize: '15px',
  fontWeight: 400,
  lineHeight: '1.65',
  margin: '0 0 6px',
}
