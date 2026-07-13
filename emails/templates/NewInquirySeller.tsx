import { Link } from '@react-email/components'
import EmailLayout, {
  EmailInquiryCard,
  EmailParagraph,
  emailInlineLinkStyle,
} from '../components/EmailLayout'

interface NewInquirySellerProps {
  listingTitle: string
  buyerName: string
  buyerEmail: string
  buyerCompany?: string | null
  buyerPhone?: string | null
  buyerMessage: string
  listingUrl: string
}

export default function NewInquirySeller({
  listingTitle,
  buyerName,
  buyerEmail,
  buyerCompany,
  buyerPhone,
  buyerMessage,
  listingUrl,
}: NewInquirySellerProps) {
  return (
    <EmailLayout
      preview={`New inquiry on "${listingTitle}"`}
      title="New inquiry on your listing"
    >
      <EmailParagraph>
        You have a new inquiry from <strong>{buyerName}</strong> on{' '}
        <Link href={listingUrl} style={emailInlineLinkStyle}>
          {listingTitle}
        </Link>
        .
      </EmailParagraph>
      <EmailInquiryCard
        buyerName={buyerName}
        buyerEmail={buyerEmail}
        buyerCompany={buyerCompany}
        buyerPhone={buyerPhone}
        message={buyerMessage}
      />
    </EmailLayout>
  )
}
