import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/rigburrito/auth'
import { stripe, tierFromPriceId, calculateMRR } from '@/lib/rigburrito/stripe'

export async function GET() {
  const auth = await requireAdminApi()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const [activeSubs, canceledSubs, mrr] = await Promise.all([
      stripe.subscriptions.list({ status: 'active', limit: 100, expand: ['data.customer'] }),
      stripe.subscriptions.list({ status: 'canceled', limit: 100, expand: ['data.customer'] }),
      calculateMRR(),
    ])

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

    const planCounts = { starter: 0, pro: 0, max: 0, free: 0 }
    const activeRows = activeSubs.data.map(sub => {
      const item = sub.items.data[0]
      const priceId = item?.price?.id ?? ''
      const plan = tierFromPriceId(priceId)
      if (plan in planCounts) planCounts[plan as keyof typeof planCounts]++
      const customer = sub.customer as { email?: string } | null
      const periodEnd = item?.current_period_end ?? (sub as { current_period_end?: number }).current_period_end
      return {
        id: sub.id,
        email: customer?.email ?? '—',
        plan,
        interval: item?.price?.recurring?.interval ?? 'month',
        amount: (item?.price?.unit_amount ?? 0) / 100,
        start_date: new Date(sub.start_date * 1000).toISOString(),
        next_billing: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      }
    })

    const newThisMonth = activeSubs.data.filter(
      s => new Date(s.start_date * 1000) >= monthStart,
    ).length

    const churnedThisMonth = canceledSubs.data.filter(s => {
      const canceled = s.canceled_at ? new Date(s.canceled_at * 1000) : null
      return canceled && canceled >= monthStart
    }).length

    const canceledRows = canceledSubs.data
      .filter(s => {
        const canceled = s.canceled_at ? new Date(s.canceled_at * 1000) : null
        return canceled && canceled >= ninetyDaysAgo
      })
      .map(sub => {
        const item = sub.items.data[0]
        const customer = sub.customer as { email?: string } | null
        return {
          id: sub.id,
          email: customer?.email ?? '—',
          plan: tierFromPriceId(item?.price?.id ?? ''),
          canceled_at: sub.canceled_at
            ? new Date(sub.canceled_at * 1000).toISOString()
            : null,
        }
      })

    return NextResponse.json({
      success: true,
      stats: {
        mrr,
        active_subscriptions: activeSubs.data.length,
        new_this_month: newThisMonth,
        churned_this_month: churnedThisMonth,
        starter_count: planCounts.starter,
        pro_count: planCounts.pro,
        max_count: planCounts.max,
      },
      active: activeRows,
      canceled: canceledRows,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Stripe error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
