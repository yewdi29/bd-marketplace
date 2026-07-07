import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/rigburrito/auth'
import { createServiceClient } from '@/lib/rigburrito/service'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminApi()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await params
  const service = createServiceClient()

  const { data: user, error: userError } = await service
    .from('users')
    .select('email')
    .eq('id', id)
    .single()

  if (userError || !user?.email) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`
  const { error } = await service.auth.resetPasswordForEmail(user.email, { redirectTo })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, email: user.email })
}
