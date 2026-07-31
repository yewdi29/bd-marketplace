import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  ALLOWED_FEEDBACK_IMAGE_TYPES,
  MAX_FEEDBACK_IMAGE_BYTES,
} from '@/lib/feedback/feedbackUpload'

const BUCKET = 'feedback-images'

/**
 * POST /api/feedback/upload
 * Anonymous-friendly screenshot upload for bug reports.
 * Reuses listing photo validation (PNG/JPG, max 4 MB).
 */
export async function POST(request: NextRequest) {
  try {
    const form = await request.formData()
    const file = form.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!ALLOWED_FEEDBACK_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_FEEDBACK_IMAGE_TYPES)[number])) {
      return NextResponse.json({ error: 'Only PNG and JPG files are allowed' }, { status: 400 })
    }

    if (file.size > MAX_FEEDBACK_IMAGE_BYTES) {
      return NextResponse.json({ error: 'File must be under 4 MB' }, { status: 400 })
    }

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const bytes = await file.arrayBuffer()
    const buffer = new Uint8Array(bytes)
    const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase().replace(/[^a-z]/g, '') || 'jpg'
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`
    const storagePath = `bugs/${safeName}`

    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(storagePath, buffer, { contentType: file.type, upsert: false })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const { data: urlData } = admin.storage.from(BUCKET).getPublicUrl(storagePath)

    return NextResponse.json({ success: true, url: urlData.publicUrl })
  } catch {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
