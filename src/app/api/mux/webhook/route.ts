import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getMuxClient } from '@/lib/mux/client'
import { handleMuxListingVideoWebhook } from '@/lib/mux/listingVideoWebhookHandlers'
import { createServiceClient } from '@/lib/rigburrito/service'

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const headerList = headers()

  let event
  try {
    event = await getMuxClient().webhooks.unwrap(rawBody, headerList)
  } catch (err) {
    console.error('[mux/webhook] signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const service = createServiceClient()

  try {
    await handleMuxListingVideoWebhook(service, event)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[mux/webhook] handler failed', {
      eventId: event.id,
      eventType: event.type,
      message,
      err,
    })
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
