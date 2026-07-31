import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/rigburrito/auth'
import { createServiceClient } from '@/lib/rigburrito/service'
import type { FeedbackStatus } from '@/lib/types/database'

const STATUSES: FeedbackStatus[] = ['new', 'reviewed', 'resolved', 'dismissed']

type Params = { params: { id: string } }

/** PATCH /api/rigburrito/feedback/[id] — update feedback status (admin only). */
export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireAdminApi()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const body = (await request.json()) as { status?: string }
    const status = body.status as FeedbackStatus | undefined

    if (!status || !STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const service = createServiceClient()
    const { data, error } = await service
      .from('feedback')
      .update({ status })
      .eq('id', params.id)
      .select('id, status')
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (!data) {
      return NextResponse.json({ error: 'Feedback not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, feedback: data })
  } catch {
    return NextResponse.json({ error: 'Failed to update feedback' }, { status: 500 })
  }
}
