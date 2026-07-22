import { NextRequest, NextResponse } from 'next/server'
import { verifyPaperclipSecret } from '@/lib/agents/verifyPaperclipSecret'
import { createServiceClient } from '@/lib/rigburrito/service'
import { sendNewInquirySellerEmailOnce } from '@/lib/inquiryVerification/sendSellerEmail'

export async function POST(req: NextRequest) {
  const authError = verifyPaperclipSecret(req)
  if (authError) return authError

  try {
    const body = await req.json() as { leadId?: string; inquiryId?: string }
    const leadId = body.leadId ?? body.inquiryId

    if (!leadId) {
      return NextResponse.json({ error: 'leadId is required' }, { status: 400 })
    }

    const service = createServiceClient()
    const result = await sendNewInquirySellerEmailOnce(service, leadId, {
      includeVerification: true,
    })

    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid request body'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
