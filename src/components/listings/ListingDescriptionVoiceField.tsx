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
  formatRecordingTimer,
  pickRecorderMimeType,
  VOICE_DICTATION_MAX_DURATION_MS,
  VOICE_DICTATION_MIN_DURATION_MS,
  extensionForMime,
} from '@/lib/listings/voiceDictation'

type InteractionMode = 'toggle' | 'hold'

interface ListingDescriptionVoiceFieldProps {
  value: string
  onChange: (value: string) => void
  /** Desktop = click to toggle; mobile = press-and-hold (matches New Listing breakpoint). */
  interactionMode: InteractionMode
  placeholder?: string
  className?: string
  style?: CSSProperties
  onFocus?: () => void
  onBlur?: () => void
  showHint?: boolean
  /**
   * Sized by the glow border ResizeObserver — must wrap ONLY the textarea box,
   * not the hint/error below (otherwise the glow drifts after dictation).
   */
  glowContainerRef?: Ref<HTMLDivElement>
  glowContainerClassName?: string
  /** Canvas (or other underlay) rendered inside the glow box, behind the field. */
  glowUnderlay?: ReactNode
}

type Phase = 'idle' | 'recording' | 'transcribing'

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
  interactionMode,
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
  const holdActiveRef = useRef(false)
  const cancelStartRef = useRef(false)
  const stoppingRef = useRef(false)
  const phaseRef = useRef<Phase>('idle')
  const onChangeRef = useRef(onChange)

  const [phase, setPhase] = useState<Phase>('idle')
  const [elapsedMs, setElapsedMs] = useState(0)
  const [error, setError] = useState('')

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

  const cleanupStream = useCallback(() => {
    if (maxTimerRef.current) {
      clearTimeout(maxTimerRef.current)
      maxTimerRef.current = null
    }
    if (tickTimerRef.current) {
      clearInterval(tickTimerRef.current)
      tickTimerRef.current = null
    }
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    mediaRecorderRef.current = null
    chunksRef.current = []
    stoppingRef.current = false
  }, [])

  useEffect(() => () => cleanupStream(), [cleanupStream])

  const transcribeBlob = useCallback(async (blob: Blob, durationMs: number) => {
    if (durationMs < VOICE_DICTATION_MIN_DURATION_MS || blob.size < 256) {
      setError('No speech detected. Hold a bit longer and try again.')
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
    recorder.stop()
  }, [cleanupStream])

  const startRecording = useCallback(async () => {
    if (phaseRef.current !== 'idle') return
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setError('Voice dictation is not supported in this browser.')
      return
    }

    cancelStartRef.current = false
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

    // Hold released (or cancelled) while permission prompt was open
    if (cancelStartRef.current) {
      stream.getTracks().forEach(t => t.stop())
      phaseRef.current = 'idle'
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
      stopRecording()
      return
    }
    void startRecording()
  }, [startRecording, stopRecording])

  const onHoldPointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (interactionMode !== 'hold' || phaseRef.current !== 'idle') return
      e.preventDefault()
      holdActiveRef.current = true
      cancelStartRef.current = false
      e.currentTarget.setPointerCapture(e.pointerId)
      void startRecording()
    },
    [interactionMode, startRecording],
  )

  const onHoldPointerUp = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (interactionMode !== 'hold') return
      holdActiveRef.current = false
      cancelStartRef.current = true
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch {
        // already released
      }
      if (mediaRecorderRef.current) {
        stopRecording()
      }
    },
    [interactionMode, stopRecording],
  )

  const recording = phase === 'recording'
  const transcribing = phase === 'transcribing'
  const micLabel =
    interactionMode === 'hold'
      ? recording
        ? 'Release to stop dictation'
        : 'Hold to dictate'
      : recording
        ? 'Stop dictation'
        : 'Dictate with microphone'

  return (
    <div>
      {/* Glow measures this box only — hint/error stay outside so the border stays aligned. */}
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
            paddingBottom: '52px',
            position: 'relative',
            zIndex: 1,
            ...style,
          }}
          placeholder={placeholder}
          disabled={transcribing}
        />

        <div
          className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none"
          style={{ zIndex: 3 }}
        >
          <div className="min-h-[36px] flex items-center gap-2">
            {recording && (
              <>
                <span
                  className="inline-block w-2 h-2 rounded-full bg-orange animate-pulse"
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

          <button
            type="button"
            aria-label={micLabel}
            title={micLabel}
            disabled={transcribing}
            onClick={interactionMode === 'toggle' ? toggleRecording : undefined}
            onPointerDown={interactionMode === 'hold' ? onHoldPointerDown : undefined}
            onPointerUp={interactionMode === 'hold' ? onHoldPointerUp : undefined}
            onPointerCancel={interactionMode === 'hold' ? onHoldPointerUp : undefined}
            onContextMenu={e => {
              if (interactionMode === 'hold') e.preventDefault()
            }}
            className={[
              'pointer-events-auto inline-flex items-center justify-center w-10 h-10 rounded-full border-2 shadow-sm transition-colors select-none touch-none',
              recording
                ? 'bg-orange border-orange text-white'
                : 'bg-orange-bg border-orange-bdr text-orange hover:bg-orange hover:border-orange hover:text-white',
              transcribing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
              recording ? 'animate-pulse' : '',
            ].join(' ')}
          >
            <Mic className="w-[18px] h-[18px]" strokeWidth={2.25} aria-hidden />
          </button>
        </div>
      </div>

      {error ? (
        <p className="mt-1.5 pr-3 text-sm text-red-600 text-right" role="alert">
          {error}
        </p>
      ) : showHint && phase === 'idle' ? (
        <p className="mt-1.5 pr-3 text-xs text-ink-3 text-right">
          {interactionMode === 'hold'
            ? 'Press and hold the mic to dictate'
            : 'Click the mic to dictate'}
        </p>
      ) : null}
    </div>
  )
}
