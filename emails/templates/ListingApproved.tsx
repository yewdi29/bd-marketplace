import EmailLayout, { EmailButton, EmailParagraph } from '../components/EmailLayout'

interface ListingApprovedProps {
  listingTitle: string
  listingUrl: string
}

export default function ListingApproved({ listingTitle, listingUrl }: ListingApprovedProps) {
  return (
    <EmailLayout
      preview={`Your listing "${listingTitle}" is now live`}
      title="Your listing is now live"
    >
      <EmailParagraph>
        Your listing <strong>{listingTitle}</strong> has been approved and is now visible to buyers
        on Black Diamond Marketplace.
      </EmailParagraph>
      <EmailButton href={listingUrl}>View listing</EmailButton>
    </EmailLayout>
  )
}
