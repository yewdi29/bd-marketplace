import EmailLayout, { EmailButton, EmailParagraph } from '../components/EmailLayout'

interface SeatBillingReceiptProps {
  organizationName: string
  changeType: 'add' | 'remove'
  actorName?: string | null
  /** When true, show that someone else triggered the change */
  showActorLine: boolean
  newSeatCount: number
  amountLabel: string
  billingUrl: string
}

export default function SeatBillingReceipt({
  organizationName,
  changeType,
  actorName,
  showActorLine,
  newSeatCount,
  amountLabel,
  billingUrl,
}: SeatBillingReceiptProps) {
  const action =
    changeType === 'add' ? 'A seat was added' : 'A seat was removed'
  const seatWord = newSeatCount === 1 ? 'seat' : 'seats'

  return (
    <EmailLayout
      preview={`${action} for ${organizationName}`}
      title="Seat billing update"
    >
      <EmailParagraph>
        {action} on <strong>{organizationName}</strong>&apos;s Enterprise account.
      </EmailParagraph>
      {showActorLine && actorName?.trim() && (
        <EmailParagraph>
          Triggered by <strong>{actorName.trim()}</strong>.
        </EmailParagraph>
      )}
      <EmailParagraph>
        Your organization now has <strong>{newSeatCount}</strong> billed {seatWord}.
      </EmailParagraph>
      <EmailParagraph>
        Proration for this change: <strong>{amountLabel}</strong>.
      </EmailParagraph>
      <EmailButton href={billingUrl}>View billing</EmailButton>
    </EmailLayout>
  )
}
