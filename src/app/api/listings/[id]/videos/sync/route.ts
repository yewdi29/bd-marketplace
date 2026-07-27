import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { canManageListingMedia } from '@/lib/listings/canManageListingMedia'
import { syncListingVideoFromMuxAsset } from '@/lib/mux/syncListingVideoAsset'
import { linkListingVideoByPassthrough } from '@/lib/mux/linkListingVideoUpload'
import { createServiceClient } from '@/lib/rigburrito/service'

type Params = { params: { id: string } }

// POST /api/listings/[id]/videos/sync — reconcile processing rows against Mux (webhook fallback).
export async function POST(_request: NextRequest, { params }: Params) {
  const cookieStore = await cookies()
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  )

  const {
    data: { user },
  } = await authClient.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const listingId = params.id
  const allowed = await canManageListingMedia(authClient, listingId, user.id)
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const service = createServiceClient()
  const { data: rows, error } = await service
    .from('listing_videos')
    .select('id, mux_asset_id, status')
    .eq('listing_id', listingId)
    .in('status', ['uploading', 'processing'])

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const results: Record<string, string> = {}

  for (const row of rows ?? []) {
    if (row.mux_asset_id) {
      const sync = await syncListingVideoFromMuxAsset(service, row.id, row.mux_asset_id)
      results[row.id] = sync.outcome
      continue
    }

    const linked = await linkListingVideoByPassthrough(service, row.id)
    results[row.id] = linked.outcome
  }

  return NextResponse.json({ success: true, results })
}
