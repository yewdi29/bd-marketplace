import EmailLayout, { EmailParagraph, emailOrangeLinkBoldStyle } from '../components/EmailLayout'
import { Link } from '@react-email/components'

interface InquiryReceivedBuyerProps {
  listingTitle: string
  listingUrl: string
}

export default function InquiryReceivedBuyer({ listingTitle, listingUrl }: InquiryReceivedBuyerProps) {
  return (
    <EmailLayout
      preview="We've received your inquiry"
      title="We've received your inquiry"
    >
      <EmailParagraph>
        Thank you for your interest in{' '}
        <Link href={listingUrl} style={emailOrangeLinkBoldStyle} className="email-orange-link">
          {listingTitle}
        </Link>
        . We&apos;ve received your inquiry and appreciate you reaching out through Black Diamond
        Marketplace.
      </EmailParagraph>
    </EmailLayout>
  )
}
