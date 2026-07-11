import EmailLayout, { EmailParagraph } from '../components/EmailLayout'

interface InquiryReceivedBuyerProps {
  listingTitle: string
}

export default function InquiryReceivedBuyer({ listingTitle }: InquiryReceivedBuyerProps) {
  return (
    <EmailLayout
      preview="We've received your inquiry"
      title="We've received your inquiry"
    >
      <EmailParagraph>
        Thank you for your interest in <strong>{listingTitle}</strong>. We&apos;ve received your
        inquiry and appreciate you reaching out through Black Diamond Marketplace.
      </EmailParagraph>
    </EmailLayout>
  )
}
