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

/** Bars in the dictation waveform UI. */
export const VOICE_WAVE_BAR_COUNT = 7

/** Quiet floor so the wave never fully collapses on silence. */
export const VOICE_WAVE_FLOOR = 0.18

/** Soft center-weighted shape for speech (mirrored). */
const VOICE_WAVE_SHAPE = [0.42, 0.62, 0.85, 1, 0.85, 0.62, 0.42] as const

export function idleWaveLevels(count = VOICE_WAVE_BAR_COUNT): number[] {
  return Array.from({ length: count }, (_, i) => VOICE_WAVE_SHAPE[i] ?? VOICE_WAVE_FLOOR).map(
    s => VOICE_WAVE_FLOOR + (s - VOICE_WAVE_FLOOR) * 0.15,
  )
}

function getAudioContextConstructor(): typeof AudioContext | null {
  if (typeof window === 'undefined') return null
  const w = window as Window & { webkitAudioContext?: typeof AudioContext }
  return window.AudioContext ?? w.webkitAudioContext ?? null
}

export interface DictationAnalyserHandle {
  /** Call once after user gesture; no-ops if already running. */
  start: (onLevels: (levels: number[]) => void) => void
  stop: () => void
}

/**
 * Live mic levels for the dictation waveform.
 * Shares the existing MediaStream — does not open a second mic.
 */
export function createDictationAnalyser(stream: MediaStream): DictationAnalyserHandle | null {
  const Ctx = getAudioContextConstructor()
  if (!Ctx) return null

  let audioCtx: AudioContext | null = null
  let analyser: AnalyserNode | null = null
  let source: MediaStreamAudioSourceNode | null = null
  let rafId: number | null = null
  let freqBuf: Uint8Array<ArrayBuffer> | null = null
  let timeBuf: Uint8Array<ArrayBuffer> | null = null
  let smoothed = idleWaveLevels()

  function stop() {
    if (rafId != null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
    try {
      source?.disconnect()
    } catch {
      // already disconnected
    }
    source = null
    analyser = null
    freqBuf = null
    timeBuf = null
    if (audioCtx && audioCtx.state !== 'closed') {
      void audioCtx.close().catch(() => {})
    }
    audioCtx = null
    smoothed = idleWaveLevels()
  }

  function start(onLevels: (levels: number[]) => void) {
    if (rafId != null || !Ctx) return

    audioCtx = new Ctx()
    analyser = audioCtx.createAnalyser()
    analyser.fftSize = 256
    analyser.smoothingTimeConstant = 0.72
    analyser.minDecibels = -75
    analyser.maxDecibels = -20

    source = audioCtx.createMediaStreamSource(stream)
    source.connect(analyser)
    // Intentionally not connected to destination (avoids speaker feedback).

    freqBuf = new Uint8Array(analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>
    timeBuf = new Uint8Array(analyser.fftSize) as Uint8Array<ArrayBuffer>

    const tick = () => {
      if (!analyser || !freqBuf || !timeBuf) return

      analyser.getByteFrequencyData(freqBuf)
      analyser.getByteTimeDomainData(timeBuf)

      // RMS from time domain — overall speech energy
      let sumSq = 0
      for (let i = 0; i < timeBuf.length; i++) {
        const v = (timeBuf[i]! - 128) / 128
        sumSq += v * v
      }
      const rms = Math.sqrt(sumSq / timeBuf.length)
      const energy = Math.min(1, Math.pow(rms * 3.2, 0.65))

      // Frequency bands (skip near-DC bins; focus on speech-ish range)
      const binCount = freqBuf.length
      const startBin = 2
      const endBin = Math.min(binCount - 1, 48)
      const usable = Math.max(1, endBin - startBin)
      const bandSize = usable / VOICE_WAVE_BAR_COUNT

      const next: number[] = []
      for (let i = 0; i < VOICE_WAVE_BAR_COUNT; i++) {
        const from = startBin + Math.floor(i * bandSize)
        const to = startBin + Math.floor((i + 1) * bandSize)
        let sum = 0
        let n = 0
        for (let b = from; b < to; b++) {
          sum += freqBuf[b]!
          n++
        }
        const band = n > 0 ? sum / (n * 255) : 0
        const shape = VOICE_WAVE_SHAPE[i] ?? 1
        // Blend global energy with per-band detail so bars move with the voice
        const mixed = Math.min(1, energy * 0.45 + band * 1.35)
        const target = VOICE_WAVE_FLOOR + (1 - VOICE_WAVE_FLOOR) * mixed * shape
        const prev = smoothed[i] ?? VOICE_WAVE_FLOOR
        // Extra EMA on top of AnalyserNode smoothing
        smoothed[i] = prev + (target - prev) * 0.38
        next.push(smoothed[i]!)
      }

      onLevels(next)
      rafId = requestAnimationFrame(tick)
    }

    const kickoff = () => {
      rafId = requestAnimationFrame(tick)
    }

    if (audioCtx.state === 'suspended') {
      void audioCtx.resume().then(kickoff).catch(kickoff)
    } else {
      kickoff()
    }
  }

  return { start, stop }
}
