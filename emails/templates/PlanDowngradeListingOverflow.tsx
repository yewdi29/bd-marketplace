import EmailLayout, {
  EmailButton,
  EmailParagraph,
  emailInlineLinkStyle,
} from '../components/EmailLayout'
import { Link } from '@react-email/components'

interface PlanDowngradeListingOverflowProps {
  newPlanLabel: string
  unpublishedCount: number
  keptActiveCount: number
  dashboardUrl: string
  upgradeUrl: string
}

export default function PlanDowngradeListingOverflow({
  newPlanLabel,
  unpublishedCount,
  keptActiveCount,
  dashboardUrl,
  upgradeUrl,
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
        was deleted.
      </EmailParagraph>
      <EmailParagraph>
        To bring these listings back right away,{' '}
        <Link href={upgradeUrl} style={emailInlineLinkStyle} className="email-orange-link">
          upgrade your plan
        </Link>{' '}
        for more active listing capacity. Prefer to stay on the Free plan? You can choose
        which listings stay active anytime from your{' '}
        <Link href={dashboardUrl} style={emailInlineLinkStyle} className="email-orange-link">
          dashboard
        </Link>
        .
      </EmailParagraph>
      <EmailButton href={upgradeUrl}>Upgrade Plan</EmailButton>
    </EmailLayout>
  )
}
