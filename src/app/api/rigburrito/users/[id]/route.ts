import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/rigburrito/auth'
import { createServiceClient } from '@/lib/rigburrito/service'
import { getListingLimit } from '@/lib/planLimits'
import type { MembershipPlan } from '@/lib/types/database'
import { stripe } from '@/lib/rigburrito/stripe'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminApi()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await params
  const service = createServiceClient()

  const { data: user, error } = await service
    .from('users')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const [{ count: activeListingCount }, { count: savedCount }, { data: membership }, { data: listings }] = await Promise.all([
    service.from('listings').select('*', { count: 'exact', head: true })
      .eq('seller_id', id).eq('status', 'active'),
    service.from('saved_listings').select('*', { count: 'exact', head: true }).eq('user_id', id),
    service.from('memberships').select('*').eq('user_id', id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    service.from('listings')
      .select('id, title, slug, status, price, created_at, updated_at, location_city, location_state, listing_images(url, is_primary, sort_order)')
      .eq('seller_id', id)
      .order('created_at', { ascending: false }),
  ])

  const plan = user.plan as MembershipPlan

  let stripeSubscription = null
  if (membership?.stripe_subscription_id) {
    try {
      const sub = await stripe.subscriptions.retrieve(membership.stripe_subscription_id)
      const item = sub.items.data[0]
      const periodEnd = item?.current_period_end ?? (sub as { current_period_end?: number }).current_period_end
      stripeSubscription = {
        id: sub.id,
        status: sub.status,
        current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
        amount: item?.price?.unit_amount ? item.price.unit_amount / 100 : 0,
        interval: item?.price?.recurring?.interval ?? 'month',
      }
    } catch {
      stripeSubscription = null
    }
  }

  return NextResponse.json({
    success: true,
    user: {
      ...user,
      listing_count: activeListingCount ?? 0,
      listing_limit: getListingLimit(plan),
      saved_count: savedCount ?? 0,
    },
    listings: (listings ?? []).map(l => {
      const images = (l.listing_images as unknown as { url: string; is_primary: boolean; sort_order: number }[]) ?? []
      const primary = images.find(i => i.is_primary) ?? images.sort((a, b) => a.sort_order - b.sort_order)[0]
      return {
        id: l.id,
        title: l.title,
        slug: l.slug,
        status: l.status,
        price: l.price,
        created_at: l.created_at,
        updated_at: l.updated_at,
        location_city: l.location_city,
        location_state: l.location_state,
        primary_image_url: primary?.url ?? null,
      }
    }),
    membership,
    stripe_subscription: stripeSubscription,
  })
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

  const updates: Record<string, unknown> = {}
  if (body.plan !== undefined) updates.plan = body.plan
  if (body.suspended !== undefined) updates.suspended = body.suspended

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const { error } = await service.from('users').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminApi()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await params
  if (id === auth.userId) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
  }

  const service = createServiceClient()
  const { error } = await service.auth.admin.deleteUser(id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
