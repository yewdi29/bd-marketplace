import { NextRequest, NextResponse } from 'next/server'
import { verifyPaperclipSecret } from '@/lib/agents/verifyPaperclipSecret'
import { createServiceClient } from '@/lib/rigburrito/service'
import { sendRedTierListingAlert } from '@/lib/email/inquiryEmails'

const AGENT_NAME = 'Red Alert'

export async function POST(req: NextRequest) {
  const authError = verifyPaperclipSecret(req)
  if (authError) return authError

  try {
    const body = await req.json()
    const {
      listing_id,
      listing_title,
      listing_price,
      seller_name,
      seller_email,
    } = body as {
      listing_id?: string
      listing_title?: string
      listing_price?: number
      seller_name?: string
      seller_email?: string
    }

    if (!listing_id || !listing_title || listing_price == null || !seller_name || !seller_email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const service = createServiceClient()

    const { error: recError } = await service.from('agent_recommendations').insert({
      agent_name: AGENT_NAME,
      entity_type: 'listing',
      entity_id: listing_id,
      recommended_action: 'alert',
      reasoning: 'Red tier listing published — immediate review recommended',
      status: 'pending',
    })

    if (recError) {
      return NextResponse.json({ error: recError.message }, { status: 500 })
    }

    const formattedPrice = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(listing_price)

    const summary = `Red tier listing published: ${listing_title} at ${formattedPrice} — seller: ${seller_name}`

    const { error: logError } = await service.from('agent_activity_log').insert({
      agent_name: AGENT_NAME,
      action: 'red_tier_alert',
      entity_type: 'listing',
      entity_id: listing_id,
      outcome: 'alerted',
      summary,
    })

    if (logError) {
      return NextResponse.json({ error: logError.message }, { status: 500 })
    }

    try {
      await sendRedTierListingAlert({
        listingTitle: listing_title,
        listingPrice: listing_price,
        sellerName: seller_name,
        sellerEmail: seller_email,
      })
    } catch (err) {
      console.error('[agents] red tier alert email error:', err)
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
