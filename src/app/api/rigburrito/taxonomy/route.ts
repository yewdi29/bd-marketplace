import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/rigburrito/auth'
import { createServiceClient } from '@/lib/rigburrito/service'

export async function GET(req: NextRequest) {
  const auth = await requireAdminApi()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const tab = req.nextUrl.searchParams.get('tab') ?? 'industries'
  const industryId = req.nextUrl.searchParams.get('industry_id') ?? ''
  const service = createServiceClient()

  if (tab === 'categories') {
    let query = service
      .from('categories')
      .select('id, name, slug, category_industries(industry_id, industries(name))')
      .order('name')

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const categories = (data ?? []).map(c => {
      const links = c.category_industries as unknown as { industry_id: string; industries: { name: string } | null }[] | null
      const first = links?.[0]
      return {
        id: c.id,
        name: c.name,
        slug: c.slug,
        industry_id: first?.industry_id ?? null,
        industry_name: first?.industries?.name ?? null,
      }
    })

    const filtered = industryId
      ? categories.filter(c => c.industry_id === industryId)
      : categories

    return NextResponse.json({ success: true, categories: filtered })
  }

  const { data: industries, error } = await service
    .from('industries')
    .select('id, name, slug, sort_order, category_industries(category_id)')
    .order('sort_order')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const result = (industries ?? []).map(i => ({
    id: i.id,
    name: i.name,
    slug: i.slug,
    sort_order: i.sort_order,
    category_count: (i.category_industries as unknown as { category_id: string }[] | null)?.length ?? 0,
  }))

  return NextResponse.json({ success: true, industries: result })
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const body = await req.json()
  const service = createServiceClient()

  if (body.type === 'industry') {
    if (!body.name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })
    const slug = body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const { data, error } = await service
      .from('industries')
      .insert({ name: body.name.trim(), slug, sort_order: body.sort_order ?? 99 })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, industry: data })
  }

  if (body.type === 'category') {
    if (!body.name?.trim() || !body.industry_id) {
      return NextResponse.json({ error: 'Name and industry required' }, { status: 400 })
    }
    const slug = body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const { data: cat, error: catError } = await service
      .from('categories')
      .insert({ name: body.name.trim(), slug })
      .select()
      .single()
    if (catError) return NextResponse.json({ error: catError.message }, { status: 500 })

    await service.from('category_industries').insert({
      category_id: cat.id,
      industry_id: body.industry_id,
    })

    return NextResponse.json({ success: true, category: cat })
  }

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdminApi()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const body = await req.json()
  const service = createServiceClient()

  if (body.type === 'industry' && body.id && body.name) {
    const { error } = await service.from('industries').update({ name: body.name.trim() }).eq('id', body.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (body.type === 'category' && body.id && body.name) {
    const { error } = await service.from('categories').update({ name: body.name.trim() }).eq('id', body.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdminApi()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const body = await req.json()
  const service = createServiceClient()

  if (body.type === 'industry' && body.id) {
    const { count } = await service
      .from('category_industries')
      .select('*', { count: 'exact', head: true })
      .eq('industry_id', body.id)
    if ((count ?? 0) > 0) {
      return NextResponse.json({ error: 'Cannot delete industry with linked categories' }, { status: 400 })
    }
    const { error } = await service.from('industries').delete().eq('id', body.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (body.type === 'category' && body.id) {
    const { count } = await service
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', body.id)
    if ((count ?? 0) > 0) {
      return NextResponse.json({ error: 'Cannot delete category with linked listings' }, { status: 400 })
    }
    await service.from('category_industries').delete().eq('category_id', body.id)
    const { error } = await service.from('categories').delete().eq('id', body.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
}
