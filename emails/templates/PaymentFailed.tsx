import EmailLayout, { EmailButton, EmailParagraph } from '../components/EmailLayout'

interface PaymentFailedProps {
  firstName?: string | null
  planLabel: string
  amountDue: string
  updatePaymentUrl: string
}

export default function PaymentFailed({
  firstName,
  planLabel,
  amountDue,
  updatePaymentUrl,
}: PaymentFailedProps) {
  const greeting = firstName?.trim() ? `Hi ${firstName.trim()},` : 'Hi there,'

  return (
    <EmailLayout
      preview={`Payment failed for your ${planLabel} plan`}
      title="We couldn't process your payment"
    >
      <EmailParagraph>{greeting}</EmailParagraph>
      <EmailParagraph>
        We were unable to charge <strong>{amountDue}</strong> for your{' '}
        <strong>{planLabel}</strong> membership on Black Diamond Marketplace.
      </EmailParagraph>
      <EmailParagraph>
        Stripe will automatically retry the payment over the next several days. To avoid any
        interruption to your listings or plan benefits, please update your payment method as
        soon as you can.
      </EmailParagraph>
      <EmailButton href={updatePaymentUrl}>Update payment method</EmailButton>
      <EmailParagraph>
        If you&apos;ve already updated your card or bank details, you can ignore this email —
        the next retry should go through.
      </EmailParagraph>
    </EmailLayout>
  )
}
