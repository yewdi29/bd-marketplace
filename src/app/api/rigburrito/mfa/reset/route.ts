import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/rigburrito/service'

/** Removes all MFA factors for the current admin user so MFA setup can start fresh. */
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const service = createServiceClient()
  const { data: profile } = await service
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Use admin API — client listFactors often misses stuck/unverified factors
  const { data: factorsData, error: listError } = await service.auth.admin.mfa.listFactors({
    userId: user.id,
  })

  if (listError) {
    return NextResponse.json({ error: listError.message }, { status: 500 })
  }

  const factors = factorsData?.factors ?? []
  let removed = 0

  for (const factor of factors) {
    const { error: deleteError } = await service.auth.admin.mfa.deleteFactor({
      id: factor.id,
      userId: user.id,
    })
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }
    removed++
  }

  return NextResponse.json({ success: true, removed })
}
