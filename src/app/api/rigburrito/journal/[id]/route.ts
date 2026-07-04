import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/rigburrito/auth'
import { createServiceClient } from '@/lib/rigburrito/service'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminApi()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await params
  const service = createServiceClient()
  const { data, error } = await service.from('articles').select('*').eq('id', id).single()
  if (error || !data) return NextResponse.json({ error: 'Article not found' }, { status: 404 })
  return NextResponse.json({ success: true, article: data })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminApi()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await params
  const body = await req.json()
  const service = createServiceClient()

  const updates: Record<string, unknown> = {}
  const fields = ['title', 'slug', 'body', 'category', 'status', 'tags', 'read_time_mins', 'meta_description', 'featured_image']
  for (const f of fields) {
    if (body[f] !== undefined) updates[f] = body[f]
  }

  if (body.publish) {
    updates.status = 'published'
    updates.published_at = new Date().toISOString()
  }
  if (body.unpublish) {
    updates.status = 'draft'
  }
  if (body.archive) {
    updates.status = 'archived'
  }

  updates.updated_at = new Date().toISOString()

  const { error } = await service.from('articles').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminApi()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await params
  const service = createServiceClient()
  const { error } = await service.from('articles').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
