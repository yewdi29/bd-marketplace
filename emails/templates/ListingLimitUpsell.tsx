import EmailLayout, { EmailButton, EmailParagraph } from '../components/EmailLayout'

interface ListingLimitUpsellProps {
  firstName?: string | null
  currentPlanLabel: string
  currentLimit: number
  nextPlanLabel: string
  nextListingAllowance: string
  upgradeUrl: string
}

export default function ListingLimitUpsell({
  firstName,
  currentPlanLabel,
  currentLimit,
  nextPlanLabel,
  nextListingAllowance,
  upgradeUrl,
}: ListingLimitUpsellProps) {
  const greeting = firstName?.trim() ? `Hi ${firstName.trim()},` : 'Hi there,'
  const listingWord = currentLimit === 1 ? 'listing' : 'listings'

  return (
    <EmailLayout
      preview={`You've hit your ${currentPlanLabel} plan's ${currentLimit}-listing limit`}
      title="Ready for more listing capacity?"
    >
      <EmailParagraph>{greeting}</EmailParagraph>
      <EmailParagraph>
        Looks like you&apos;ve hit the active listing limit on your{' '}
        <strong>{currentPlanLabel}</strong> plan ({currentLimit} {listingWord}). That means
        you can&apos;t publish another listing until you free up a slot or upgrade.
      </EmailParagraph>
      <EmailParagraph>
        Upgrade to <strong>{nextPlanLabel}</strong> for{' '}
        <strong>{nextListingAllowance}</strong> — so you can keep growing your inventory on
        Black Diamond Marketplace without hitting the ceiling again.
      </EmailParagraph>
      <EmailButton href={upgradeUrl}>Upgrade to {nextPlanLabel}</EmailButton>
    </EmailLayout>
  )
}
