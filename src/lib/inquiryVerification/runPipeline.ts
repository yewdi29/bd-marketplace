import { createServiceClient } from '@/lib/rigburrito/service'
import { runInquiryVerification } from '@/lib/inquiryVerification/index'
import { sendNewInquirySellerEmailOnce } from '@/lib/inquiryVerification/sendSellerEmail'

/** Run Claude verification, persist to inquiry_verifications, and send seller email (green tier). */
export async function runInquiryVerificationPipeline(leadId: string): Promise<void> {
  const service = createServiceClient()

  const { data: lead, error } = await service
    .from('leads')
    .select(`
      id,
      buyer_id,
      buyer_name,
      message,
      status,
      tier,
      listings(title)
    `)
    .eq('id', leadId)
    .single()

  if (error || !lead) {
    console.error('[inquiry] pipeline: lead not found', leadId, error?.message)
    return
  }

  if (!lead.buyer_id) {
    console.warn('[inquiry] pipeline: skipping lead without buyer_id', leadId)
    return
  }

  const listing = lead.listings as unknown as { title: string } | null

  const { data: existing } = await service
    .from('inquiry_verifications')
    .select('id')
    .eq('inquiry_id', leadId)
    .maybeSingle()

  if (!existing) {
    await runInquiryVerification({
      client: service,
      inquiryId: leadId,
      buyerUserId: lead.buyer_id,
      buyerName: lead.buyer_name,
      message: lead.message,
      listingTitle: listing?.title,
    })
  }

  const effectiveTier = lead.tier ?? 'green'
  if (effectiveTier === 'green' && lead.status === 'new') {
    await sendNewInquirySellerEmailOnce(service, leadId, { includeVerification: true })
  }
}
