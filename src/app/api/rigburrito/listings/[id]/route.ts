import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/rigburrito/auth'
import { createServiceClient } from '@/lib/rigburrito/service'
import { sendListingRemovedNotification } from '@/lib/email/inquiryEmails'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminApi()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await params
  const service = createServiceClient()

  const { data: listing, error } = await service
    .from('listings')
    .select(`
      *,
      users!listings_seller_id_fkey(id, full_name, email, company_name, phone),
      industries(name),
      categories:category_id(name),
      listing_images(id, url, alt_text, sort_order, is_primary)
    `)
    .eq('id', id)
    .single()

  if (error || !listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })

  return NextResponse.json({ success: true, listing })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminApi()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await params
  const body = await req.json()
  const service = createServiceClient()

  const allowed = ['status', 'admin_flagged', 'featured', 'title', 'description', 'price']
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key]
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields' }, { status: 400 })
  }

  const { error } = await service.from('listings').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (updates.status === 'active') {
    await service
      .from('listing_flags')
      .update({ resolved_at: new Date().toISOString() })
      .eq('listing_id', id)
      .is('resolved_at', null)
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminApi()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await params
  const service = createServiceClient()

  const { data: listing } = await service
    .from('listings')
    .select('title, users!listings_seller_id_fkey(email)')
    .eq('id', id)
    .single()

  const { error } = await service.from('listings').update({ status: 'removed' }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const seller = listing?.users as unknown as { email: string } | null
  if (seller?.email && listing?.title) {
    try {
      await sendListingRemovedNotification(seller.email, listing.title)
    } catch (err) {
      console.error('[listings] remove notification error:', err)
    }
  }

  return NextResponse.json({ success: true })
}
