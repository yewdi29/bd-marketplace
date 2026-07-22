import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/rigburrito/service'
import { runInquiryVerificationPipeline } from '@/lib/inquiryVerification/runPipeline'
import { sendNewInquirySellerEmailOnce } from '@/lib/inquiryVerification/sendSellerEmail'

const FALLBACK_AFTER_MS = 30_000

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createServiceClient()
  const cutoff = new Date(Date.now() - FALLBACK_AFTER_MS).toISOString()

  const { data: pending, error } = await service
    .from('leads')
    .select('id')
    .eq('tier', 'green')
    .eq('status', 'new')
    .is('seller_inquiry_email_sent_at', null)
    .not('listing_id', 'is', null)
    .lt('created_at', cutoff)
    .limit(50)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let sent = 0
  let deduplicated = 0
  let verified = 0

  for (const lead of pending ?? []) {
    try {
      const { data: verification } = await service
        .from('inquiry_verifications')
        .select('id')
        .eq('inquiry_id', lead.id)
        .maybeSingle()

      if (!verification) {
        try {
          await runInquiryVerificationPipeline(lead.id)
          verified++
        } catch (pipelineErr) {
          console.error(`[cron/inquiry-seller-fallback] verification pipeline ${lead.id}:`, pipelineErr)
        }
      }

      const { data: verificationAfter } = await service
        .from('inquiry_verifications')
        .select('id')
        .eq('inquiry_id', lead.id)
        .maybeSingle()

      const result = await sendNewInquirySellerEmailOnce(service, lead.id, {
        includeVerification: Boolean(verificationAfter),
      })
      if (result.sent) sent++
      if (result.deduplicated) deduplicated++
    } catch (err) {
      console.error(`[cron/inquiry-seller-fallback] lead ${lead.id}:`, err)
    }
  }

  return NextResponse.json({
    success: true,
    checked: pending?.length ?? 0,
    verified,
    sent,
    deduplicated,
  })
}
