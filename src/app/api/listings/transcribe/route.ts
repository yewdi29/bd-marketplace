import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import {
  VOICE_DICTATION_ALLOWED_MIME_PREFIXES,
  VOICE_DICTATION_MAX_BYTES,
  VOICE_DICTATION_MAX_DURATION_MS,
  VOICE_DICTATION_MIN_DURATION_MS,
  extensionForMime,
} from '@/lib/listings/voiceDictation'

function isAllowedMime(mime: string): boolean {
  const base = mime.split(';')[0]?.trim().toLowerCase() ?? ''
  return VOICE_DICTATION_ALLOWED_MIME_PREFIXES.some(prefix => base === prefix)
}

// POST /api/listings/transcribe
export async function POST(request: NextRequest) {
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

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.error('OPENAI_API_KEY is not configured')
    return NextResponse.json(
      { error: "Couldn't catch that. Please try again." },
      { status: 503 },
    )
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid upload. Please try again.' }, { status: 400 })
  }

  const audio = formData.get('audio')
  if (!(audio instanceof File)) {
    return NextResponse.json({ error: 'Audio file is required.' }, { status: 400 })
  }

  const durationRaw = formData.get('duration_ms')
  const durationMs =
    typeof durationRaw === 'string' && durationRaw.trim() !== ''
      ? Number(durationRaw)
      : NaN

  if (!Number.isFinite(durationMs) || durationMs < 0) {
    return NextResponse.json({ error: 'Recording duration is required.' }, { status: 400 })
  }
  if (durationMs < VOICE_DICTATION_MIN_DURATION_MS) {
    return NextResponse.json(
      { error: 'No speech detected. Hold a bit longer and try again.' },
      { status: 400 },
    )
  }
  if (durationMs > VOICE_DICTATION_MAX_DURATION_MS + 2_000) {
    return NextResponse.json(
      { error: 'Recording is too long. Keep it under 2.5 minutes.' },
      { status: 400 },
    )
  }

  if (audio.size <= 0 || audio.size > VOICE_DICTATION_MAX_BYTES) {
    return NextResponse.json(
      { error: 'Recording is too large. Try a shorter clip.' },
      { status: 400 },
    )
  }

  const mime = audio.type || 'audio/webm'
  if (!isAllowedMime(mime)) {
    return NextResponse.json(
      { error: "Couldn't catch that. Please try again." },
      { status: 400 },
    )
  }

  const ext = extensionForMime(mime)
  const filename = audio.name?.includes('.') ? audio.name : `dictation.${ext}`

  const openaiForm = new FormData()
  openaiForm.append('file', audio, filename)
  openaiForm.append('model', 'whisper-1')
  openaiForm.append('response_format', 'json')

  let openaiRes: Response
  try {
    openaiRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: openaiForm,
    })
  } catch (err) {
    console.error('OpenAI Whisper fetch failed:', err)
    return NextResponse.json(
      { error: "Couldn't catch that. Please try again." },
      { status: 502 },
    )
  }

  if (!openaiRes.ok) {
    const errText = await openaiRes.text().catch(() => '')
    console.error('OpenAI Whisper error:', openaiRes.status, errText)
    return NextResponse.json(
      { error: "Couldn't catch that. Please try again." },
      { status: 502 },
    )
  }

  let data: { text?: string }
  try {
    data = (await openaiRes.json()) as { text?: string }
  } catch (err) {
    console.error('Failed to parse Whisper response:', err)
    return NextResponse.json(
      { error: "Couldn't catch that. Please try again." },
      { status: 502 },
    )
  }

  const text = typeof data.text === 'string' ? data.text.trim() : ''
  if (!text) {
    return NextResponse.json(
      { error: 'No speech detected. Try speaking a bit louder or longer.' },
      { status: 400 },
    )
  }

  return NextResponse.json({ success: true, text })
}
