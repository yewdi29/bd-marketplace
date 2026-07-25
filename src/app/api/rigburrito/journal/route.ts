import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/rigburrito/auth'
import { slugifyTitle } from '@/lib/rigburrito/strings'
import { createServiceClient } from '@/lib/rigburrito/service'

export async function GET() {
  const auth = await requireAdminApi()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const service = createServiceClient()
  const { data, error } = await service
    .from('articles')
    .select('id, title, slug, category, status, read_time_mins, published_at, created_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, articles: data ?? [] })
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const body = await req.json()
  if (!body.title?.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  const service = createServiceClient()
  const slug = body.slug?.trim() || slugifyTitle(body.title)
  const status = body.status ?? 'draft'
  const now = new Date().toISOString()

  const metaDescription = body.meta_description?.trim() || null

  const { data, error } = await service
    .from('articles')
    .insert({
      author_id: auth.userId,
      title: body.title.trim(),
      slug,
      body: body.body ?? '',
      category: body.category ?? 'industry',
      status,
      tags: body.tags ?? [],
      read_time_mins: body.read_time_mins ?? null,
      meta_description: metaDescription,
      featured_image: body.featured_image ?? null,
      excerpt: metaDescription,
      published_at: status === 'published' ? now : null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, article: data })
}
