import EmailLayout, { EmailButton, EmailFeedbackBlock, EmailParagraph } from '../components/EmailLayout'

interface ListingNeedsChangesProps {
  listingTitle: string
  flagComment: string
  editUrl: string
}

export default function ListingNeedsChanges({
  listingTitle,
  flagComment,
  editUrl,
}: ListingNeedsChangesProps) {
  return (
    <EmailLayout
      preview={`Updates needed on "${listingTitle}"`}
      title="Updates needed on your listing"
    >
      <EmailParagraph>
        Your listing <strong>{listingTitle}</strong> needs a few changes before it can go live.
        Please review the feedback below and update your listing.
      </EmailParagraph>
      <EmailFeedbackBlock>{flagComment}</EmailFeedbackBlock>
      <EmailButton href={editUrl}>Edit listing</EmailButton>
    </EmailLayout>
  )
}
