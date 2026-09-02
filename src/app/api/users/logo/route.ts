import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg']
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB
const BUCKET = 'company-logos'

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()

  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Auth check
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: membership } = await adminClient
    .from('org_members')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (membership) {
    return NextResponse.json(
      { error: 'Company logo is managed in Organization settings for enterprise accounts' },
      { status: 403 },
    )
  }

  // Parse multipart form
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Only PNG and JPG files are allowed' }, { status: 400 })
  }

  // Validate file size
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: 'File must be under 5 MB' }, { status: 400 })
  }

  // Determine extension
  const ext = file.type === 'image/png' ? 'png' : 'jpg'
  const storagePath = `${user.id}/logo.${ext}`

  // Upload (upsert — overwrites any existing logo)
  const buffer = Buffer.from(await file.arrayBuffer())
  const { error: uploadError } = await adminClient.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: true,
    })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  // Get public URL
  const { data: urlData } = adminClient.storage.from(BUCKET).getPublicUrl(storagePath)
  // Bust cache so the browser sees the new image
  const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`

  // Persist URL to users table
  const { error: updateError } = await adminClient
    .from('users')
    .update({ company_logo_url: urlData.publicUrl, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, url: publicUrl })
}

export async function DELETE() {
  const cookieStore = await cookies()

  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: membership } = await adminClient
    .from('org_members')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (membership) {
    return NextResponse.json(
      { error: 'Company logo is managed in Organization settings for enterprise accounts' },
      { status: 403 },
    )
  }

  // Clear the URL from the users table
  const { error } = await adminClient
    .from('users')
    .update({ company_logo_url: null, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Also remove from storage (both extensions)
  await adminClient.storage.from(BUCKET).remove([`${user.id}/logo.jpg`, `${user.id}/logo.png`])

  return NextResponse.json({ success: true })
}
