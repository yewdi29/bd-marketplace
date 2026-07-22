import { NextRequest, NextResponse } from 'next/server'
import { verifyPaperclipSecret } from '@/lib/agents/verifyPaperclipSecret'
import { createServiceClient } from '@/lib/rigburrito/service'
import { persistInquiryVerification } from '@/lib/inquiryVerification/persist'
import type { ContentRiskFlag, InquiryTrustLabel } from '@/lib/inquiryVerification/types'

export async function POST(req: NextRequest) {
  const authError = verifyPaperclipSecret(req)
  if (authError) return authError

  try {
    const body = await req.json()
    const {
      inquiry_id,
      buyer_tier_at_submission,
      trust_label,
      content_risk_score,
      content_risk_flags,
      agent_reasoning,
      listing_title,
      buyer_name,
    } = body as {
      inquiry_id?: string
      buyer_tier_at_submission?: string
      trust_label?: InquiryTrustLabel
      content_risk_score?: number
      content_risk_flags?: ContentRiskFlag[]
      agent_reasoning?: string
      listing_title?: string
      buyer_name?: string
    }

    if (
      !inquiry_id ||
      !buyer_tier_at_submission ||
      !trust_label ||
      content_risk_score == null ||
      !agent_reasoning
    ) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['verified_member', 'unverified_free'].includes(trust_label)) {
      return NextResponse.json({ error: 'Invalid trust_label' }, { status: 400 })
    }

    if (content_risk_score < 0 || content_risk_score > 100) {
      return NextResponse.json({ error: 'Invalid content_risk_score' }, { status: 400 })
    }

    const service = createServiceClient()

    const { data: lead, error: leadError } = await service
      .from('leads')
      .select('id, buyer_name, listings(title)')
      .eq('id', inquiry_id)
      .single()

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 })
    }

    const listing = lead.listings as unknown as { title: string } | null

    await persistInquiryVerification(
      service,
      {
        inquiry_id,
        buyer_tier_at_submission,
        trust_label,
        content_risk_score,
        content_risk_flags: content_risk_flags ?? [],
        agent_reasoning,
      },
      {
        listingTitle: listing_title ?? listing?.title,
        buyerName: buyer_name ?? lead.buyer_name,
      },
    )

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid request body'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
