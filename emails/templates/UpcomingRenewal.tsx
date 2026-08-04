import EmailLayout, { EmailButton, EmailParagraph } from '../components/EmailLayout'

interface UpcomingRenewalProps {
  firstName?: string | null
  planLabel: string
  amountDue: string
  renewalDate: string
  manageBillingUrl: string
}

export default function UpcomingRenewal({
  firstName,
  planLabel,
  amountDue,
  renewalDate,
  manageBillingUrl,
}: UpcomingRenewalProps) {
  const greeting = firstName?.trim() ? `Hi ${firstName.trim()},` : 'Hi there,'

  return (
    <EmailLayout
      preview={`Your ${planLabel} plan renews on ${renewalDate}`}
      title="Your plan renews soon"
    >
      <EmailParagraph>{greeting}</EmailParagraph>
      <EmailParagraph>
        This is a heads-up that your <strong>{planLabel}</strong> membership on Black Diamond
        Marketplace renews on <strong>{renewalDate}</strong> for <strong>{amountDue}</strong>.
      </EmailParagraph>
      <EmailParagraph>
        No action is needed if you want to keep your current plan. To update your payment
        method, change tiers, or cancel before renewal, manage your billing anytime.
      </EmailParagraph>
      <EmailButton href={manageBillingUrl}>Manage billing</EmailButton>
    </EmailLayout>
  )
}
