import { NextRequest, NextResponse } from 'next/server'
import { verifyPaperclipSecret } from '@/lib/agents/verifyPaperclipSecret'
import { createServiceClient } from '@/lib/rigburrito/service'
import { dispatchListingNeedsChangesEmail } from '@/lib/email/transactionalEmails'

export async function POST(req: NextRequest) {
  const authError = verifyPaperclipSecret(req)
  if (authError) return authError

  try {
    const body = await req.json() as { listingId?: string; flagComment?: string }
    const listingId = body.listingId
    const flagComment = body.flagComment?.trim()

    if (!listingId || !flagComment) {
      return NextResponse.json({ error: 'listingId and flagComment are required' }, { status: 400 })
    }

    const service = createServiceClient()
    const { data: listing, error } = await service
      .from('listings')
      .select('id, title, users!listings_seller_id_fkey(email)')
      .eq('id', listingId)
      .single()

    if (error || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    const seller = listing.users as unknown as { email: string } | null
    if (!seller?.email) {
      return NextResponse.json({ error: 'Seller email not found' }, { status: 404 })
    }

    await dispatchListingNeedsChangesEmail({
      sellerEmail: seller.email,
      listingId: listing.id,
      listingTitle: listing.title,
      flagComment,
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
