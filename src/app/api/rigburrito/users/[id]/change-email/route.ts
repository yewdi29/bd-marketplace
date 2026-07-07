import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/rigburrito/auth'
import { createServiceClient } from '@/lib/rigburrito/service'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminApi()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await params
  const body = await req.json()
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
  }

  const service = createServiceClient()
  const { error: authError } = await service.auth.admin.updateUserById(id, { email })
  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 })

  const { error: dbError } = await service.from('users').update({ email }).eq('id', id)
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
