import EmailLayout, { EmailButton, EmailParagraph } from '../components/EmailLayout'

interface PlanDowngradeListingOverflowProps {
  newPlanLabel: string
  unpublishedCount: number
  keptActiveCount: number
  dashboardUrl: string
}

export default function PlanDowngradeListingOverflow({
  newPlanLabel,
  unpublishedCount,
  keptActiveCount,
  dashboardUrl,
}: PlanDowngradeListingOverflowProps) {
  const listingWord = unpublishedCount === 1 ? 'listing' : 'listings'

  return (
    <EmailLayout
      preview={`${unpublishedCount} ${listingWord} unpublished after plan change`}
      title="Your membership plan has changed"
    >
      <EmailParagraph>
        Your Black Diamond Marketplace membership is now on the{' '}
        <strong>{newPlanLabel}</strong> plan. Because this plan includes fewer active
        listing slots, we unpublished <strong>{unpublishedCount}</strong> of your
        listings to match your new limit.
      </EmailParagraph>
      <EmailParagraph>
        Your <strong>{keptActiveCount} most recently created</strong> active listings
        remain live on the marketplace. Unpublished listings are saved as drafts — nothing
        was deleted — and you can republish them anytime from your dashboard when you
        have available slots.
      </EmailParagraph>
      <EmailButton href={dashboardUrl}>Manage listings</EmailButton>
    </EmailLayout>
  )
}
