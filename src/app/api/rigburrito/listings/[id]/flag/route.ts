import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/rigburrito/auth'
import { createServiceClient } from '@/lib/rigburrito/service'
import { sendListingFlaggedNotification } from '@/lib/email/inquiryEmails'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminApi()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await params
  const body = await req.json()
  const comment = (body.comment as string | undefined)?.trim()

  if (!comment || comment.length < 20) {
    return NextResponse.json(
      { error: 'Flag comment must be at least 20 characters' },
      { status: 400 },
    )
  }

  const service = createServiceClient()

  const { data: listing, error: listingError } = await service
    .from('listings')
    .select('id, title, seller_id, users!listings_seller_id_fkey(email)')
    .eq('id', id)
    .single()

  if (listingError || !listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  }

  const { error: flagError } = await service.from('listing_flags').insert({
    listing_id: id,
    admin_id: auth.userId,
    comment,
  })

  if (flagError) return NextResponse.json({ error: flagError.message }, { status: 500 })

  const { error: updateError } = await service
    .from('listings')
    .update({ status: 'draft', admin_flagged: true, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  const seller = listing.users as unknown as { email: string } | null
  if (seller?.email) {
    try {
      await sendListingFlaggedNotification(seller.email, listing.title, comment)
    } catch (err) {
      console.error('[listings] flag notification error:', err)
    }
  }

  return NextResponse.json({ success: true })
}
