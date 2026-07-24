export function buyerFirstName(buyerName: string): string {
  const trimmed = buyerName.trim()
  if (!trimmed) return buyerName
  return trimmed.split(/\s+/)[0] ?? trimmed
}

/** mailto link for the seller "Reply to [Buyer]" CTA — subject/body URL-encoded. */
export function buildInquiryReplyMailto(opts: {
  buyerEmail: string
  buyerName: string
  listingTitle: string
}): string {
  const firstName = buyerFirstName(opts.buyerName)
  const params = new URLSearchParams()
  params.set('subject', `Re: Inquiry on ${opts.listingTitle}`)
  params.set('body', `Hi ${firstName},\r\n\r\n`)
  return `mailto:${encodeURIComponent(opts.buyerEmail)}?${params.toString()}`
}
