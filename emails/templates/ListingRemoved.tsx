import EmailLayout, { EMAIL_SUPPORT_ADDRESS, EmailParagraph } from '../components/EmailLayout'

interface ListingRemovedProps {
  listingTitle: string
  removalReason: string
  supportEmail?: string
}

export default function ListingRemoved({
  listingTitle,
  removalReason,
  supportEmail = EMAIL_SUPPORT_ADDRESS,
}: ListingRemovedProps) {
  return (
    <EmailLayout
      preview={`Your listing "${listingTitle}" has been removed`}
      title="Your listing has been removed"
    >
      <EmailParagraph>
        Your listing <strong>{listingTitle}</strong> has been removed from Black Diamond Marketplace
        by our team for the following reason:
      </EmailParagraph>
      <EmailParagraph>{removalReason}</EmailParagraph>
      <EmailParagraph>
        If you have questions about this decision, please contact us at{' '}
        <a href={`mailto:${supportEmail}`} style={{ color: '#FF6B35' }}>
          {supportEmail}
        </a>
        .
      </EmailParagraph>
    </EmailLayout>
  )
}
