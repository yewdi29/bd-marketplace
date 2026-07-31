import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import type { FeedbackCategory } from '@/lib/types/database'

const CATEGORIES: FeedbackCategory[] = ['bug', 'feature_request', 'like', 'dislike']

/**
 * POST /api/feedback
 * Public submit endpoint — auth optional. Captures page URL + user context server-side.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      category?: string
      message?: string
      image_url?: string | null
      page_url?: string
    }

    const category = body.category as FeedbackCategory | undefined
    const message = typeof body.message === 'string' ? body.message.trim() : ''
    const pageUrl = typeof body.page_url === 'string' ? body.page_url.trim() : ''
    const imageUrl =
      typeof body.image_url === 'string' && body.image_url.trim()
        ? body.image_url.trim()
        : null

    if (!category || !CATEGORIES.includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }
    if (!message || message.length < 3) {
      return NextResponse.json({ error: 'Please enter a message' }, { status: 400 })
    }
    if (message.length > 5000) {
      return NextResponse.json({ error: 'Message is too long (max 5000 characters)' }, { status: 400 })
    }
    if (!pageUrl || pageUrl.length > 2000) {
      return NextResponse.json({ error: 'Invalid page URL' }, { status: 400 })
    }
    if (category !== 'bug' && imageUrl) {
      return NextResponse.json({ error: 'Images are only allowed for bug reports' }, { status: 400 })
    }

    let userId: string | null = null
    let userTier: string | null = null
    let userRole: string | null = null

    try {
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        userId = user.id
        const admin = createServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
        )

        const [{ data: profile }, { data: orgMember }] = await Promise.all([
          admin.from('users').select('plan').eq('id', user.id).maybeSingle(),
          admin
            .from('org_members')
            .select('role')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .maybeSingle(),
        ])

        userTier = profile?.plan ?? null
        userRole = orgMember?.role ?? null
      }
    } catch {
      // Anonymous path — leave identity fields null
    }

    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { error } = await admin.from('feedback').insert({
      category,
      message,
      image_url: imageUrl,
      page_url: pageUrl,
      user_id: userId,
      user_tier: userTier,
      user_role: userRole,
      status: 'new',
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
