import EmailLayout, { EmailButton, EmailFeedbackBlock, EmailParagraph } from '../components/EmailLayout'

interface ListingVerificationAdminReviewProps {
  listingTitle: string
  listingUrl: string | null
  confidenceScore: number
  reasoning: string
  flagComment: string
  reviewUrl: string
}

/** Admin-only: inert review link — no action until a button is clicked on the landing page. */
export default function ListingVerificationAdminReview({
  listingTitle,
  listingUrl,
  confidenceScore,
  reasoning,
  flagComment,
  reviewUrl,
}: ListingVerificationAdminReviewProps) {
  return (
    <EmailLayout
      preview={`Low-score listing needs review — ${listingTitle}`}
      title="Listing needs admin review"
    >
      <EmailParagraph>
        The Listing Verifier scored <strong>{listingTitle}</strong> below 55 and flagged it.
        No seller email was sent. Review the listing and choose an action.
      </EmailParagraph>
      <EmailParagraph>
        Score: <strong>{confidenceScore}</strong>
        {listingUrl ? (
          <>
            {' · '}
            <a href={listingUrl} style={{ color: '#FF6B35' }}>
              View listing
            </a>
          </>
        ) : null}
      </EmailParagraph>
      <EmailParagraph>
        <strong>Agent reasoning</strong>
      </EmailParagraph>
      <EmailFeedbackBlock>{reasoning}</EmailFeedbackBlock>
      <EmailParagraph>
        <strong>Recommended seller feedback</strong>
      </EmailParagraph>
      <EmailFeedbackBlock>{flagComment}</EmailFeedbackBlock>
      <EmailButton href={reviewUrl}>Review this listing</EmailButton>
    </EmailLayout>
  )
}
