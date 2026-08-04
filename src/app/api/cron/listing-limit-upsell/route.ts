import { NextRequest, NextResponse } from 'next/server'
import type { MembershipPlan } from '@/lib/types/database'
import { createServiceClient } from '@/lib/rigburrito/service'
import { sendListingLimitUpsellEmail } from '@/lib/email/listingLimitUpsell'

/** Eligible window: first limit hit between ~24h and ~48h ago. */
const WINDOW_START_MS = 24 * 60 * 60 * 1000
const WINDOW_END_MS = 48 * 60 * 60 * 1000

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createServiceClient()
  const now = Date.now()
  const windowEnd = new Date(now - WINDOW_START_MS).toISOString() // 24h ago
  const windowStart = new Date(now - WINDOW_END_MS).toISOString() // 48h ago

  const { data: candidates, error } = await service
    .from('users')
    .select('id, email, full_name, plan, listing_limit_reached_at')
    .is('listing_limit_upsell_sent_at', null)
    .not('listing_limit_reached_at', 'is', null)
    .gte('listing_limit_reached_at', windowStart)
    .lte('listing_limit_reached_at', windowEnd)
    .limit(100)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let sent = 0
  let skipped = 0
  let failed = 0

  for (const user of candidates ?? []) {
    if (!user.email) {
      skipped++
      continue
    }

    try {
      const firstName = user.full_name?.trim()?.split(/\s+/)[0] ?? null
      const result = await sendListingLimitUpsellEmail({
        userId: user.id,
        recipientEmail: user.email,
        firstName,
        plan: (user.plan ?? 'free') as MembershipPlan,
      })

      if (result.skipped) {
        skipped++
        continue
      }

      if (!result.sent) {
        failed++
        continue
      }

      const { error: stampError } = await service
        .from('users')
        .update({ listing_limit_upsell_sent_at: new Date().toISOString() })
        .eq('id', user.id)
        .is('listing_limit_upsell_sent_at', null)

      if (stampError) {
        console.error(`[cron/listing-limit-upsell] stamp failed for ${user.id}:`, stampError)
        failed++
        continue
      }

      sent++
    } catch (err) {
      failed++
      console.error(`[cron/listing-limit-upsell] user ${user.id}:`, err)
    }
  }

  return NextResponse.json({
    success: true,
    checked: candidates?.length ?? 0,
    sent,
    skipped,
    failed,
  })
}
