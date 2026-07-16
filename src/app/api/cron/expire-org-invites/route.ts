import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/rigburrito/service'
import { expireOrganizationInvites } from '@/lib/organizations/inviteExpiration'

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
  const organizationId = req.nextUrl.searchParams.get('organizationId') ?? undefined

  try {
    const service = createServiceClient()
    const result = await expireOrganizationInvites(service, { dryRun, organizationId })

    return NextResponse.json(
      {
        success: result.errors.length === 0,
        ...result,
      },
      { status: result.errors.length > 0 ? 500 : 200 },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invite expiration job failed'
    console.error('[expire-org-invites]', message)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
