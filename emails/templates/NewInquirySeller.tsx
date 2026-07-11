import EmailLayout, { EmailButton, EmailFeedbackBlock, EmailParagraph } from '../components/EmailLayout'

interface NewInquirySellerProps {
  listingTitle: string
  buyerName: string
  buyerMessage: string
  dashboardUrl: string
}

export default function NewInquirySeller({
  listingTitle,
  buyerName,
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
        <strong>{listingTitle}</strong>.
      </EmailParagraph>
      <EmailFeedbackBlock>{buyerMessage}</EmailFeedbackBlock>
      <EmailButton href={dashboardUrl}>View in dashboard</EmailButton>
    </EmailLayout>
  )
}
