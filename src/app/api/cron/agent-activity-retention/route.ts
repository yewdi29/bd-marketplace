import { NextRequest, NextResponse } from 'next/server'
import { runAgentActivityRetention } from '@/lib/rigburrito/agentActivityRetention'
import { createServiceClient } from '@/lib/rigburrito/service'

function verifyCronSecret(req: NextRequest): NextResponse | null {
  const expected = process.env.CRON_SECRET
  if (!expected) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 500 })
  }

  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return null
}

export async function GET(req: NextRequest) {
  const authError = verifyCronSecret(req)
  if (authError) return authError

  const dryRun = req.nextUrl.searchParams.get('dryRun') === 'true'
  const retentionDaysParam = req.nextUrl.searchParams.get('retentionDays')
  const retentionDays = retentionDaysParam != null ? Number(retentionDaysParam) : undefined

  if (retentionDays != null && (!Number.isFinite(retentionDays) || retentionDays < 0)) {
    return NextResponse.json({ error: 'retentionDays must be a non-negative number' }, { status: 400 })
  }

  try {
    const service = createServiceClient()
    const result = await runAgentActivityRetention(service, { dryRun, retentionDays })

    const status = result.errors.length > 0 ? 500 : 200

    return NextResponse.json(
      {
        success: result.errors.length === 0,
        ...result,
      },
      { status },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Retention job failed'
    console.error('[agent-activity-retention]', message)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
