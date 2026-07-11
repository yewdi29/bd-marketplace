import { Link } from '@react-email/components'
import EmailLayout, {
  EmailFeedbackBlock,
  EmailFromBlock,
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
  dashboardUrl: string
}

export default function NewInquirySeller({
  listingTitle,
  buyerName,
  buyerEmail,
  buyerCompany,
  buyerPhone,
  buyerMessage,
  dashboardUrl,
}: NewInquirySellerProps) {
  return (
    <EmailLayout
      preview={`New inquiry on "${listingTitle}"`}
      title="New inquiry on your listing"
    >
      <EmailParagraph>
        You have a new inquiry from <strong>{buyerName}</strong> on{' '}
        <Link href={dashboardUrl} style={emailInlineLinkStyle}>
          {listingTitle}
        </Link>
        .
      </EmailParagraph>
      <EmailFromBlock
        buyerName={buyerName}
        buyerEmail={buyerEmail}
        buyerCompany={buyerCompany}
        buyerPhone={buyerPhone}
      />
      <EmailFeedbackBlock>{buyerMessage}</EmailFeedbackBlock>
    </EmailLayout>
  )
}
