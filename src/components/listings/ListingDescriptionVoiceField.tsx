'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type Ref,
} from 'react'
import { Mic } from 'lucide-react'
import { inputCls } from '@/components/listings/ListingTaxonomyFields'
import {
  createDictationAnalyser,
  formatRecordingTimer,
  idleWaveLevels,
  pickRecorderMimeType,
  VOICE_DICTATION_MAX_DURATION_MS,
  VOICE_DICTATION_MIN_DURATION_MS,
  VOICE_WAVE_BAR_COUNT,
  extensionForMime,
  type DictationAnalyserHandle,
} from '@/lib/listings/voiceDictation'

interface ListingDescriptionVoiceFieldProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  style?: CSSProperties
  onFocus?: () => void
  onBlur?: () => void
  showHint?: boolean
  /**
   * Sized by the glow border ResizeObserver — must wrap ONLY the textarea box,
   * not the hint/error/mic below (otherwise the glow drifts after dictation).
   */
  glowContainerRef?: Ref<HTMLDivElement>
  glowContainerClassName?: string
  /** Canvas (or other underlay) rendered inside the glow box, behind the field. */
  glowUnderlay?: ReactNode
}

type Phase = 'idle' | 'recording' | 'transcribing'

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'

function DictationWaveform({
  compact,
  levels,
}: {
  compact?: boolean
  levels: number[]
}) {
  return (
    <span
      className={[
        'dictation-wave inline-flex items-end justify-center shrink-0',
        compact ? 'h-4 gap-[2.5px]' : 'h-5 gap-[3px]',
      ].join(' ')}
      aria-hidden
    >
      {Array.from({ length: VOICE_WAVE_BAR_COUNT }, (_, i) => {
        const level = levels[i] ?? 0.2
        return (
          <span
            key={i}
            className="dictation-wave-bar bg-current rounded-full"
            style={{
              width: compact ? 2.5 : 3,
              height: '100%',
              transform: `scaleY(${level})`,
              opacity: 0.55 + level * 0.45,
            }}
          />
        )
      })}
    </span>
  )
}

function insertAtCursor(value: string, insert: string, cursor: number | null): {
  next: string
  caret: number
} {
  const at = cursor == null || cursor < 0 || cursor > value.length ? value.length : cursor
  const before = value.slice(0, at)
  const after = value.slice(at)

  let piece = insert
  if (before && !/\s$/.test(before) && !/^\s/.test(piece)) {
    piece = ` ${piece}`
  }
  if (after && !/\s$/.test(piece) && !/^\s/.test(after)) {
    piece = `${piece} `
  }

  return { next: `${before}${piece}${after}`, caret: before.length + piece.length }
}

export default function ListingDescriptionVoiceField({
  value,
  onChange,
  placeholder = 'Detailed equipment description for buyers…',
  className,
  style,
  onFocus,
  onBlur,
  showHint = true,
  glowContainerRef,
  glowContainerClassName,
  glowUnderlay,
}: ListingDescriptionVoiceFieldProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const cursorRef = useRef<number | null>(null)
  const valueRef = useRef(value)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startedAtRef = useRef<number>(0)
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tickTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stoppingRef = useRef(false)
  const phaseRef = useRef<Phase>('idle')
  const onChangeRef = useRef(onChange)
  const analyserRef = useRef<DictationAnalyserHandle | null>(null)

  const [phase, setPhase] = useState<Phase>('idle')
  const [elapsedMs, setElapsedMs] = useState(0)
  const [error, setError] = useState('')
  const [waveLevels, setWaveLevels] = useState<number[]>(() => idleWaveLevels())

  useEffect(() => {
    valueRef.current = value
  }, [value])

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  const rememberCursor = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    cursorRef.current = el.selectionStart
  }, [])

  const stopAnalyser = useCallback(() => {
    analyserRef.current?.stop()
    analyserRef.current = null
    setWaveLevels(idleWaveLevels())
  }, [])

  const cleanupStream = useCallback(() => {
    if (maxTimerRef.current) {
      clearTimeout(maxTimerRef.current)
      maxTimerRef.current = null
    }
    if (tickTimerRef.current) {
      clearInterval(tickTimerRef.current)
      tickTimerRef.current = null
    }
    stopAnalyser()
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    mediaRecorderRef.current = null
    chunksRef.current = []
    stoppingRef.current = false
  }, [stopAnalyser])

  useEffect(() => () => cleanupStream(), [cleanupStream])

  const transcribeBlob = useCallback(async (blob: Blob, durationMs: number) => {
    if (durationMs < VOICE_DICTATION_MIN_DURATION_MS || blob.size < 256) {
      setError('No speech detected. Speak a bit longer and try again.')
      setPhase('idle')
      return
    }

    setPhase('transcribing')
    setError('')

    const mime = blob.type || 'audio/webm'
    const file = new File([blob], `dictation.${extensionForMime(mime)}`, { type: mime })
    const body = new FormData()
    body.append('audio', file)
    body.append('duration_ms', String(Math.round(durationMs)))

    try {
      const res = await fetch('/api/listings/transcribe', { method: 'POST', body })
      const data = (await res.json()) as { text?: string; error?: string; success?: boolean }
      if (!res.ok || !data.text) {
        setError(data.error ?? "Couldn't catch that. Please try again.")
        setPhase('idle')
        return
      }

      const { next, caret } = insertAtCursor(valueRef.current, data.text, cursorRef.current)
      onChangeRef.current(next)
      setPhase('idle')

      requestAnimationFrame(() => {
        const el = textareaRef.current
        if (!el) return
        el.focus()
        el.setSelectionRange(caret, caret)
        cursorRef.current = caret
      })
    } catch {
      setError("Couldn't catch that. Please try again.")
      setPhase('idle')
    }
  }, [])

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current
    if (!recorder || stoppingRef.current) return
    if (recorder.state === 'inactive') {
      cleanupStream()
      setPhase('idle')
      return
    }
    stoppingRef.current = true
    if (maxTimerRef.current) {
      clearTimeout(maxTimerRef.current)
      maxTimerRef.current = null
    }
    if (tickTimerRef.current) {
      clearInterval(tickTimerRef.current)
      tickTimerRef.current = null
    }
    stopAnalyser()
    recorder.stop()
  }, [cleanupStream, stopAnalyser])

  const startRecording = useCallback(async () => {
    if (phaseRef.current !== 'idle') return
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setError('Voice dictation is not supported in this browser.')
      return
    }

    setError('')
    rememberCursor()
    phaseRef.current = 'recording'

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (err) {
      phaseRef.current = 'idle'
      const name = err instanceof DOMException ? err.name : ''
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setError(
          'Microphone access is needed to dictate. Allow the mic in your browser settings and try again.',
        )
      } else if (name === 'NotFoundError') {
        setError('No microphone found. Connect a mic and try again.')
      } else {
        setError('Could not start the microphone. Please try again.')
      }
      setPhase('idle')
      return
    }

    // Stopped while permission prompt was open
    if (phaseRef.current !== 'recording') {
      stream.getTracks().forEach(t => t.stop())
      setPhase('idle')
      return
    }

    streamRef.current = stream
    chunksRef.current = []
    const mimeType = pickRecorderMimeType()
    let recorder: MediaRecorder
    try {
      recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream)
    } catch {
      stream.getTracks().forEach(t => t.stop())
      streamRef.current = null
      phaseRef.current = 'idle'
      setError('Could not start recording. Please try again.')
      setPhase('idle')
      return
    }

    mediaRecorderRef.current = recorder
    startedAtRef.current = Date.now()
    setElapsedMs(0)
    setPhase('recording')

    // Live waveform from the same mic stream
    const analyser = createDictationAnalyser(stream)
    analyserRef.current = analyser
    analyser?.start(levels => setWaveLevels(levels))

    recorder.ondataavailable = event => {
      if (event.data.size > 0) chunksRef.current.push(event.data)
    }

    recorder.onstop = () => {
      const durationMs = Date.now() - startedAtRef.current
      const type = recorder.mimeType || mimeType || 'audio/webm'
      const blob = new Blob(chunksRef.current, { type })
      cleanupStream()
      void transcribeBlob(blob, durationMs)
    }

    recorder.onerror = () => {
      cleanupStream()
      phaseRef.current = 'idle'
      setPhase('idle')
      setError("Couldn't catch that. Please try again.")
    }

    try {
      recorder.start(250)
    } catch {
      cleanupStream()
      phaseRef.current = 'idle'
      setPhase('idle')
      setError('Could not start recording. Please try again.')
      return
    }

    tickTimerRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startedAtRef.current)
    }, 200)

    maxTimerRef.current = setTimeout(() => {
      stopRecording()
    }, VOICE_DICTATION_MAX_DURATION_MS)
  }, [cleanupStream, rememberCursor, stopRecording, transcribeBlob])

  const toggleRecording = useCallback(() => {
    if (phaseRef.current === 'transcribing') return
    if (phaseRef.current === 'recording' || mediaRecorderRef.current) {
      if (mediaRecorderRef.current) {
        stopRecording()
      } else {
        // Permission prompt still open / recorder not ready — cancel start
        phaseRef.current = 'idle'
        setPhase('idle')
      }
      return
    }
    void startRecording()
  }, [startRecording, stopRecording])

  const recording = phase === 'recording'
  const transcribing = phase === 'transcribing'
  const active = recording || transcribing

  const micLabel = recording
    ? 'Stop recording'
    : transcribing
      ? 'Transcribing'
      : 'Dictate with microphone'

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full">
      {/* Glow measures this box only — mic/hint/error stay outside so the border stays aligned. */}
      <div
        ref={glowContainerRef}
        className={['relative', glowContainerClassName].filter(Boolean).join(' ')}
        style={{ borderRadius: '10px' }}
      >
        {glowUnderlay}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => {
            onChange(e.target.value)
            cursorRef.current = e.target.selectionStart
          }}
          onSelect={rememberCursor}
          onClick={rememberCursor}
          onKeyUp={rememberCursor}
          onFocus={() => {
            rememberCursor()
            onFocus?.()
          }}
          onBlur={() => {
            rememberCursor()
            onBlur?.()
          }}
          className={`${inputCls} resize-none leading-relaxed ${className ?? ''}`}
          style={{
            minHeight: '120px',
            position: 'relative',
            zIndex: 1,
            ...style,
          }}
          placeholder={placeholder}
          disabled={transcribing}
        />
      </div>

      <div className="mt-2.5 w-full flex flex-col items-stretch gap-1.5">
        {(recording || transcribing) && (
          <div className="flex items-center gap-2 min-h-[18px] self-end lg:self-end">
            {recording && (
              <>
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full bg-[#DC2626]"
                  style={{ animation: 'dictation-rec-dot 1.2s ease-in-out infinite' }}
                  aria-hidden
                />
                <span className="text-xs font-mono text-ink-2 tabular-nums">
                  {formatRecordingTimer(elapsedMs)}
                  <span className="text-ink-3"> / {formatRecordingTimer(VOICE_DICTATION_MAX_DURATION_MS)}</span>
                </span>
              </>
            )}
            {transcribing && (
              <span className="text-xs font-sans font-medium text-ink-2">Transcribing…</span>
            )}
          </div>
        )}

        <div className="w-full flex justify-end">
          <button
            type="button"
            aria-label={micLabel}
            aria-pressed={recording}
            title={micLabel}
            disabled={transcribing}
            onClick={toggleRecording}
            className={[
              'dictation-mic-btn relative inline-flex items-center justify-center overflow-hidden select-none touch-manipulation',
              'border-2 shadow-sm font-sans font-semibold',
              active
                ? [
                    'bg-[#DC2626] border-[#DC2626] text-white',
                    'w-full max-lg:min-h-[56px] max-lg:rounded-pill max-lg:px-5',
                    'lg:w-14 lg:h-14 lg:min-h-0 lg:rounded-full lg:px-0',
                  ].join(' ')
                : 'w-12 h-12 min-h-12 rounded-full bg-orange-bg border-orange-bdr text-orange hover:bg-orange hover:border-orange hover:text-white',
              transcribing ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
            ].join(' ')}
            style={{
              transition: [
                `width 0.55s ${EASE}`,
                `height 0.45s ${EASE}`,
                `min-height 0.45s ${EASE}`,
                `border-radius 0.45s ${EASE}`,
                `background-color 0.4s ${EASE}`,
                `border-color 0.4s ${EASE}`,
                `color 0.35s ${EASE}`,
                `box-shadow 0.4s ${EASE}`,
                'opacity 0.25s ease',
                `padding 0.45s ${EASE}`,
              ].join(', '),
              boxShadow: recording ? '0 8px 24px rgba(220, 38, 38, 0.28)' : undefined,
            }}
          >
            {/* Layout spacer — mobile pill height only (desktop uses fixed circle size) */}
            {active && (
              <span
                className="invisible inline-flex items-center justify-center gap-3 lg:hidden"
                aria-hidden
              >
                <DictationWaveform levels={waveLevels} />
                <span className="text-sm font-bold tracking-tight whitespace-nowrap">
                  {recording ? 'Stop recording' : 'Transcribing…'}
                </span>
              </span>
            )}

            {/* Idle mic */}
            <span
              className="absolute inset-0 flex items-center justify-center"
              style={{
                opacity: active ? 0 : 1,
                transform: active ? 'scale(0.72)' : 'scale(1)',
                transition: `opacity 0.28s ${EASE}, transform 0.4s ${EASE}`,
                pointerEvents: 'none',
              }}
            >
              <Mic className="w-5 h-5" strokeWidth={2.25} aria-hidden />
            </span>

            {/* Active — mobile stretched label + wave */}
            <span
              className="absolute inset-0 max-lg:flex lg:hidden items-center justify-center gap-3 px-5"
              style={{
                opacity: active ? 1 : 0,
                transform: active ? 'scale(1)' : 'scale(0.94) translateY(4px)',
                transition: `opacity 0.35s ${EASE} 0.06s, transform 0.45s ${EASE}`,
                pointerEvents: 'none',
              }}
            >
              {recording ? (
                <>
                  <DictationWaveform levels={waveLevels} />
                  <span className="text-sm font-bold tracking-tight whitespace-nowrap">
                    Stop recording
                  </span>
                </>
              ) : (
                <span className="text-sm font-bold tracking-tight whitespace-nowrap">
                  Transcribing…
                </span>
              )}
            </span>

            {/* Active — desktop circle wave / spinner */}
            <span
              className="absolute inset-0 hidden lg:flex items-center justify-center"
              style={{
                opacity: active ? 1 : 0,
                transform: active ? 'scale(1)' : 'scale(0.7)',
                transition: `opacity 0.35s ${EASE} 0.06s, transform 0.45s ${EASE}`,
                pointerEvents: 'none',
              }}
            >
              {recording ? (
                <DictationWaveform compact levels={waveLevels} />
              ) : (
                <span
                  className="w-4 h-4 rounded-full border-2 border-white/35 border-t-white"
                  style={{ animation: 'dictation-spin 0.7s linear infinite' }}
                  aria-hidden
                />
              )}
            </span>
          </button>
        </div>
      </div>

      {error ? (
        <p className="mt-1.5 text-sm text-red-600 text-right" role="alert">
          {error}
        </p>
      ) : showHint && phase === 'idle' ? (
        <p className="mt-1.5 text-xs text-ink-3 text-right">
          Tap the mic to dictate
        </p>
      ) : null}
    </div>
  )
}
