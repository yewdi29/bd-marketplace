import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/rigburrito/auth'
import { createServiceClient } from '@/lib/rigburrito/service'
import { stripe, tierFromPriceId } from '@/lib/rigburrito/stripe'

const TAB_LIMIT = 50

export async function GET(req: NextRequest) {
  const auth = await requireAdminApi()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const tab = req.nextUrl.searchParams.get('tab') ?? 'pending_approvals'
  const service = createServiceClient()

  if (tab === 'pending_approvals') {
    const { data, error } = await service
      .from('listings')
      .select(
        `id, title, slug, status, tier, price, price_unit, created_at,
         users!listings_seller_id_fkey(full_name, email)`,
      )
      .eq('status', 'pending_review')
      .in('tier', ['yellow', 'red'])
      .order('created_at', { ascending: false })
      .limit(TAB_LIMIT)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const rows = (data ?? []).map(l => {
      const seller = l.users as unknown as { full_name: string | null; email: string } | null
      return {
        id: l.id,
        title: l.title,
        slug: l.slug,
        tier: l.tier,
        status: l.status,
        price: l.price,
        price_unit: l.price_unit ?? 'total',
        seller_name: seller?.full_name ?? seller?.email ?? 'Unknown',
        created_at: l.created_at,
      }
    })

    return NextResponse.json({ success: true, tab, rows })
  }

  if (tab === 'agent_activity') {
    const { data, error } = await service
      .from('agent_activity_log')
      .select('id, agent_name, action, entity_type, entity_id, outcome, summary, created_at')
      .order('created_at', { ascending: false })
      .limit(TAB_LIMIT)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, tab, rows: data ?? [] })
  }

  if (tab === 'yellow_red_leads') {
    const { data, error } = await service
      .from('leads')
      .select(
        `id, buyer_name, buyer_email, status, tier, message, created_at,
         listings(title, slug, price, tier)`,
      )
      .in('tier', ['yellow', 'red'])
      .eq('status', 'pending_review')
      .order('created_at', { ascending: false })
      .limit(TAB_LIMIT)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const rows = (data ?? []).map(row => {
      const listing = row.listings as unknown as {
        title: string
        slug: string | null
        price: number
        tier: string | null
      } | null
      return {
        id: row.id,
        buyer_name: row.buyer_name,
        buyer_email: row.buyer_email,
        status: row.status,
        tier: row.tier,
        message: row.message,
        listing_title: listing?.title ?? null,
        listing_price: listing?.price ?? null,
        listing_tier: listing?.tier ?? row.tier,
        created_at: row.created_at,
      }
    })

    return NextResponse.json({ success: true, tab, rows })
  }

  if (tab === 'membership_activity') {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [{ data: signups }, canceledSubs] = await Promise.all([
      service
        .from('users')
        .select('id, full_name, email, plan, created_at')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(TAB_LIMIT),
      stripe.subscriptions.list({ status: 'canceled', limit: 100, expand: ['data.customer'] }),
    ])

    const canceledRows = canceledSubs.data
      .filter(s => {
        const canceled = s.canceled_at ? new Date(s.canceled_at * 1000) : null
        return canceled && canceled >= thirtyDaysAgo
      })
      .slice(0, TAB_LIMIT)
      .map(sub => {
        const item = sub.items.data[0]
        const customer = sub.customer as { email?: string } | null
        return {
          id: sub.id,
          type: 'cancellation' as const,
          email: customer?.email ?? '—',
          plan: tierFromPriceId(item?.price?.id ?? ''),
          created_at: sub.canceled_at
            ? new Date(sub.canceled_at * 1000).toISOString()
            : new Date().toISOString(),
        }
      })

    const signupRows = (signups ?? []).map(u => ({
      id: u.id,
      type: 'signup' as const,
      email: u.email,
      full_name: u.full_name,
      plan: u.plan,
      created_at: u.created_at,
    }))

    const rows = [...signupRows, ...canceledRows]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, TAB_LIMIT)

    return NextResponse.json({
      success: true,
      tab,
      rows,
      notes: {
        membership_activity:
          'Combines recent signups and Stripe cancellations. Plan upgrades/downgrades history is not tracked in the database.',
      },
    })
  }

  return NextResponse.json({ error: 'Unknown tab' }, { status: 400 })
}
