/** Max recording length — client auto-stops and server rejects longer clips. */
export const VOICE_DICTATION_MAX_DURATION_MS = 150_000 // 2.5 minutes

/** Soft floor — shorter clips are usually empty taps / silence. */
export const VOICE_DICTATION_MIN_DURATION_MS = 400

/**
 * Server-side byte cap. ~2.5 min of Opus/WebM is well under this;
 * Whisper allows up to 25 MB — we stay far below that for cost/safety.
 */
export const VOICE_DICTATION_MAX_BYTES = 5 * 1024 * 1024

export const VOICE_DICTATION_ALLOWED_MIME_PREFIXES = [
  'audio/webm',
  'audio/mp4',
  'audio/mpeg',
  'audio/mpga',
  'audio/m4a',
  'audio/wav',
  'audio/x-wav',
  'audio/ogg',
  'audio/aac',
] as const

export function formatRecordingTimer(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function extensionForMime(mime: string): string {
  const base = mime.split(';')[0]?.trim().toLowerCase() ?? ''
  if (base.includes('webm')) return 'webm'
  if (base.includes('ogg')) return 'ogg'
  if (base.includes('wav')) return 'wav'
  if (base.includes('mpeg') || base === 'audio/mpga') return 'mp3'
  if (base.includes('mp4') || base.includes('m4a') || base.includes('aac')) return 'm4a'
  return 'webm'
}

export function pickRecorderMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return ''
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
    'audio/wav',
  ]
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) return type
  }
  return ''
}
