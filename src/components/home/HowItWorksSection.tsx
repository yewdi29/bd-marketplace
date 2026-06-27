'use client'

import Image from 'next/image'
import dynamic from 'next/dynamic'
import { Inbox } from 'lucide-react'
import { useEffect, useRef, useState, useCallback, type ReactNode } from 'react'
import { useFlagIconsCss } from '@/hooks/useFlagIconsCss'
import { HIW_RIPPLE_DURATION_MS, HIW_RIPPLE_START_DELAY_MS, STEP2_POST_LIVE_MS } from '@/components/home/hiwGeoMapConstants'

const HiwGeoDotMap = dynamic(
  () => import('@/components/home/hiwGeoDotMap'),
  {
    ssr: false,
    loading: () => <div style={{ width: '100%', height: '100%' }} aria-hidden />,
  },
)

// ─── Timeline phases ──────────────────────────────────────────────────────────

type Phase =
  | 'idle'
  | 's1_border' | 's1_type' | 's1_button' | 's1_loading' | 's1_listing'
  | 'c1'
  | 's2_border' | 's2_pending' | 's2_live'
  | 'c2'
  | 's3_border' | 's3_inquiry1' | 's3_inquiry2' | 's3_inquiry3' | 's3_inquiry4'
  | 'hold'

const TYPEWRITER_TEXT =
  'Selling a 2013 cat d8t, good condition, Houston TX, asking $185,000.'

/** Matches Connector CSS transition duration (ms). */
const CONNECTOR_FILL_MS = 1000

const S1_LISTING_FADE_DELAY_MS = 300
const S3_BORDER_TO_INQUIRY_MS = 1500
const S3_INQUIRY_TO_HOLD_MS = 6500
const HOLD_TO_IDLE_MS = 500

/** Step 1 phases only — c1 / s2_live / c2 are event-driven. */
const S1_TIMELINE: { at: number; phase: Phase }[] = [
  { at: 0, phase: 's1_border' },
  { at: 1500, phase: 's1_type' },
  { at: 4500, phase: 's1_button' },
  { at: 5100, phase: 's1_loading' },
  { at: 6600, phase: 's1_listing' },
]

/** Shared gray mockup zone — equal padding on all sides (p-2 = 8px). */
const HIW_MOCKUP_BOX =
  'relative w-full h-full min-h-[260px] overflow-hidden rounded-[12px] bg-[#FAFAFA] p-2'

// ─── Connector line ───────────────────────────────────────────────────────────

function Connector({
  vertical,
  filling,
  filled,
  onFillComplete,
}: {
  vertical?: boolean
  filling: boolean
  filled: boolean
  onFillComplete?: () => void
}) {
  const [fillAmount, setFillAmount] = useState(0)

  useEffect(() => {
    if (filling || filled) {
      const id = requestAnimationFrame(() => setFillAmount(100))
      return () => cancelAnimationFrame(id)
    }
    setFillAmount(0)
  }, [filling, filled])

  useEffect(() => {
    if (!filling || !onFillComplete) return
    const id = setTimeout(onFillComplete, CONNECTOR_FILL_MS)
    return () => clearTimeout(id)
  }, [filling, onFillComplete])

  const showFill = fillAmount > 0

  if (vertical) {
    return (
      <div className="flex lg:hidden justify-center py-2" style={{ height: 48 }}>
        <div className="relative w-px h-full">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'repeating-linear-gradient(to bottom, #D4D5D7 0, #D4D5D7 4px, transparent 4px, transparent 8px)',
            }}
          />
          <div
            className="absolute top-0 left-0 w-full bg-orange origin-top rounded-full"
            style={{
              height: `${fillAmount}%`,
              transition: 'height 1s ease-in-out',
              boxShadow: showFill
                ? '0 0 6px rgba(255,107,53,0.8), 0 0 14px rgba(255,107,53,0.45), 0 0 24px rgba(255,107,53,0.2)'
                : undefined,
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div
      className="hidden lg:flex items-center shrink-0 px-1"
      style={{ width: 56, alignSelf: 'center' }}
    >
      <div className="relative w-full" style={{ height: 2 }}>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'repeating-linear-gradient(to right, #D4D5D7 0, #D4D5D7 4px, transparent 4px, transparent 8px)',
          }}
        />
        <div
          className="absolute top-0 left-0 h-full bg-orange rounded-full"
          style={{
            width: `${fillAmount}%`,
            transition: 'width 1s ease-in-out',
            boxShadow: showFill
              ? '0 0 6px rgba(255,107,53,0.8), 0 0 14px rgba(255,107,53,0.45), 0 0 24px rgba(255,107,53,0.2)'
              : undefined,
          }}
        />
      </div>
    </div>
  )
}

// ─── Step 1 mockup ────────────────────────────────────────────────────────────

function Step1Mockup({
  phase,
  onListingFadeInStart,
}: {
  phase: Phase
  onListingFadeInStart?: () => void
}) {
  const [typed, setTyped] = useState('')
  const [buttonPressed, setButtonPressed] = useState(false)
  const [progressWidth, setProgressWidth] = useState(0)
  const [showListing, setShowListing] = useState(false)
  const [fadeForm, setFadeForm] = useState(false)

  const showForm = !showListing
  const isTypingPhase = phase === 's1_border' || phase === 's1_type'
  const showCursor = isTypingPhase && !showListing
  const buttonMuted = isTypingPhase
  const showProgress = phase === 's1_loading'

  useEffect(() => {
    if (phase !== 'idle') return
    setTyped('')
    setButtonPressed(false)
    setProgressWidth(0)
    setShowListing(false)
    setFadeForm(false)
  }, [phase])

  const formVisible = showForm && !fadeForm

  useEffect(() => {
    if (phase !== 's1_type') return
    setTyped('')
    let i = 0
    const interval = setInterval(() => {
      i += 1
      setTyped(TYPEWRITER_TEXT.slice(0, i))
      if (i >= TYPEWRITER_TEXT.length) clearInterval(interval)
    }, Math.floor(3000 / TYPEWRITER_TEXT.length))
    return () => clearInterval(interval)
  }, [phase])

  useEffect(() => {
    if (phase !== 's1_button') return
    let releaseTimer: ReturnType<typeof setTimeout>
    const pressTimer = setTimeout(() => {
      setButtonPressed(true)
      releaseTimer = setTimeout(() => setButtonPressed(false), 150)
    }, 300)
    return () => {
      clearTimeout(pressTimer)
      clearTimeout(releaseTimer)
    }
  }, [phase])

  useEffect(() => {
    if (phase !== 's1_loading') return
    setProgressWidth(0)
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setProgressWidth(100))
    })
    return () => cancelAnimationFrame(id)
  }, [phase])

  useEffect(() => {
    if (phase !== 's1_listing') return
    setFadeForm(true)
    const t = setTimeout(() => {
      setShowListing(true)
      onListingFadeInStart?.()
    }, S1_LISTING_FADE_DELAY_MS)
    return () => clearTimeout(t)
  }, [phase, onListingFadeInStart])

  useEffect(() => {
    if (phase === 'c1' || phase.startsWith('s2') || phase.startsWith('c2') || phase.startsWith('s3') || phase === 'hold') {
      // keep listing visible until reset
    }
    if (phase === 'idle') {
      setShowListing(false)
      setFadeForm(false)
    }
  }, [phase])

  return (
    <div className={HIW_MOCKUP_BOX}>
      <div className="relative w-full h-full min-h-[244px]">
        {/* Form layer — fixed footprint so the mockup area never resizes */}
        <div
          className="absolute inset-0 flex flex-col justify-center transition-opacity duration-500"
          style={{ opacity: formVisible ? 1 : 0, pointerEvents: formVisible ? 'auto' : 'none' }}
        >
          <div className="w-full flex flex-col">
            <div
              className="w-full rounded-[10px] border border-[#D4D5D7] bg-white px-3 py-2.5 text-left overflow-hidden"
              style={{ fontSize: 11, lineHeight: 1.5, color: '#4A4D52', height: 72 }}
            >
              <span className="whitespace-pre-wrap break-words">
                {typed}
                {showCursor && (
                  <span
                    className="inline-block w-px h-3.5 bg-orange ml-px align-text-bottom"
                    style={{ animation: 'hiw-cursor-blink 1s step-end infinite', verticalAlign: 'text-bottom' }}
                  />
                )}
              </span>
            </div>

            <div className="mt-2 w-full flex flex-col">
              <button
                type="button"
                className="inline-flex items-center self-start px-3 py-1.5 text-[10px] font-bold text-white bg-orange rounded-pill"
                style={{
                  transform: buttonPressed ? 'scale(0.94)' : 'scale(1)',
                  boxShadow: '0 2px 8px rgba(255,107,53,0.25)',
                  opacity: buttonMuted ? 0.5 : 1,
                  transition: 'transform 150ms ease, opacity 300ms ease',
                }}
              >
                Generate Listing →
              </button>

              <div
                className="mt-1.5 w-full"
                style={{
                  opacity: showProgress ? 1 : 0,
                  height: 28,
                }}
              >
                <p className="text-[9px] font-mono text-orange mb-1">Generating listing...</p>
                <div className="h-1.5 rounded-pill bg-[#F0F0F0] overflow-hidden">
                  <div
                    className="h-full bg-orange rounded-pill"
                    style={{ width: `${progressWidth}%`, transition: 'width 1500ms linear' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Listing layer — centered in gray box */}
        <div
          className="absolute inset-0 flex items-center justify-center transition-opacity duration-500"
          style={{ opacity: showListing ? 1 : 0, pointerEvents: showListing ? 'auto' : 'none' }}
        >
          <div className="w-[76%] max-w-full mx-auto">
            <MiniListingCard />
          </div>
        </div>
      </div>
    </div>
  )
}

function MiniListingCard() {
  return (
    <div className="bg-white border border-[#E8E9EA] rounded-[12px] overflow-hidden shadow-card w-full">
      <div
        className="relative w-full bg-[#F0F0F0]"
        style={{ paddingBottom: '60%', borderRadius: '12px 12px 0 0' }}
      >
        <Image
          src="/cat-d6t-mockup-listing.png"
          alt="2013 Caterpillar D6T Dozer"
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 33vw"
        />
      </div>
      <div className="p-2.5">
        <p className="font-mono text-[9px] uppercase tracking-[0.08em] text-ink-3 mb-0.5">
          Crawler Dozers
        </p>
        <h4 className="font-sans text-ink line-clamp-2 mb-0.5" style={{ fontSize: 11, fontWeight: 500, lineHeight: 1.35 }}>
          2013 Caterpillar D6T Dozer
        </h4>
        <p className="font-mono mb-1.5" style={{ fontSize: 12, fontWeight: 500, color: '#FF6B35' }}>
          $185,000
        </p>
        <span
          className="inline-flex items-center font-sans gap-1"
          style={{
            background: '#F7F8F9',
            border: '1px solid #E8E9EA',
            color: '#4A4D52',
            fontSize: 9,
            borderRadius: 100,
            padding: '2px 8px',
          }}
        >
          <span
            className="inline-flex shrink-0 overflow-hidden border border-[#E8E9EA] fi fis fi-us"
            style={{ width: 12, height: 12, borderRadius: '50%', backgroundSize: 'cover' }}
            aria-hidden
          />
          Houston, TX
        </span>
      </div>
    </div>
  )
}

// ─── Step 2 mockup ────────────────────────────────────────────────────────────

function Step2Mockup({ phase, loopId }: { phase: Phase; loopId: number }) {
  const [rippleProgress, setRippleProgress] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const rippleRafRef = useRef<number>(0)

  useEffect(() => {
    if (phase === 'idle') {
      setRippleProgress(0)
      setIsActive(false)
      cancelAnimationFrame(rippleRafRef.current)
    }
  }, [phase])

  useEffect(() => {
    if (phase !== 's2_live') return

    setIsActive(true)
    setRippleProgress(0)

    const start = performance.now()

    const tick = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(1, elapsed / HIW_RIPPLE_DURATION_MS)
      setRippleProgress(progress)
      if (progress < 1) {
        rippleRafRef.current = requestAnimationFrame(tick)
      }
    }

    rippleRafRef.current = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(rippleRafRef.current)
  }, [phase, loopId])

  const showPill = phase !== 'idle'
  const isLive = [
    's2_live',
    'c2',
    's3_border',
    's3_inquiry1',
    's3_inquiry2',
    's3_inquiry3',
    's3_inquiry4',
    'hold',
  ].includes(phase)

  return (
    <div className={HIW_MOCKUP_BOX}>
      <div className="relative w-full h-full min-h-[244px]">
        <HiwGeoDotMap rippleProgress={rippleProgress} isActive={isActive} />
        {showPill && (
          <span
            className="absolute top-0 right-0 z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded-pill font-mono font-bold text-[9px] border transition-colors duration-500"
            style={{
              background: isLive ? '#F0FFF0' : '#FDF6E3',
              color: isLive ? '#1A5C18' : '#7A5C00',
              borderColor: isLive ? '#C8F5C4' : '#F0D98A',
              animation: !isLive ? 'hiw-pulse 1.5s ease-in-out infinite' : undefined,
            }}
          >
            {isLive && (
              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
            {isLive ? 'Live' : 'Pending'}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Step 3 mockup ────────────────────────────────────────────────────────────

const INQUIRY_NOTIFICATIONS = [
  {
    initials: 'MR',
    name: 'Marcus R.',
    subject: 'New inquiry — 2013 Caterpillar Crawler Dozer',
    preview: "I'm interested in this unit. Is it still available?",
    time: 'Just now',
  },
  {
    initials: 'JT',
    name: 'James T.',
    subject: 'New inquiry — 2013 Caterpillar Crawler Dozer',
    preview: 'Can you share more details on hours and condition?',
    time: '2 min ago',
  },
  {
    initials: 'SW',
    name: 'Scott W.',
    subject: 'New inquiry — 2013 Caterpillar Crawler Dozer',
    preview: 'Would you consider a partial trade?',
    time: '5 min ago',
  },
  {
    initials: 'DP',
    name: 'David P.',
    subject: 'New inquiry — 2013 Caterpillar Crawler Dozer',
    preview: "Ready to move forward — what's your best price?",
    time: '8 min ago',
  },
] as const

const INQUIRY_STACK_GAP = 36
/** Full stack height when all four cards are visible (~card body + 3 gaps). */
const INQUIRY_STACK_HEIGHT = 76 + INQUIRY_STACK_GAP * 3

function InquiryCard({
  data,
  stackIndex,
  visible,
}: {
  data: (typeof INQUIRY_NOTIFICATIONS)[number]
  stackIndex: number
  visible: boolean
}) {
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    if (!visible) {
      setEntered(false)
      return
    }
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setEntered(true))
    })
    return () => cancelAnimationFrame(id)
  }, [visible])

  return (
    <div
      className="absolute left-0 right-0 bg-white border border-[#E8E9EA] rounded-[12px] shadow-card px-3 py-2.5"
      style={{
        top: stackIndex * INQUIRY_STACK_GAP,
        opacity: entered ? 1 : 0,
        transform: entered ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 400ms ease, transform 400ms ease',
        zIndex: 10 + stackIndex,
      }}
    >
      <div className="flex items-start gap-2">
        <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center font-sans font-bold text-[10px] text-white bg-orange">
          {data.initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="font-sans font-semibold text-ink text-[11px]">{data.name}</p>
            <span className="text-[9px] font-sans text-ink-3 shrink-0">{data.time}</span>
          </div>
          <p className="font-sans font-medium text-ink text-[10px] mt-0.5 truncate">{data.subject}</p>
          <p className="font-sans text-ink-3 text-[9px] mt-0.5 line-clamp-2 leading-snug">{data.preview}</p>
        </div>
      </div>
    </div>
  )
}

function Step3Mockup({ phase, loopId }: { phase: Phase; loopId: number }) {
  const [cardsShown, setCardsShown] = useState<boolean[]>([false, false, false, false])
  const [stackOpacity, setStackOpacity] = useState(1)
  const [inboxIdleVisible, setInboxIdleVisible] = useState(true)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const step3Active = [
    's3_inquiry1',
    's3_inquiry2',
    's3_inquiry3',
    's3_inquiry4',
    'hold',
  ].includes(phase)

  const clearLocalTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }, [])

  const schedule = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms)
    timersRef.current.push(id)
  }, [])

  useEffect(() => {
    if (phase === 'idle') {
      clearLocalTimers()
      setCardsShown([false, false, false, false])
      setStackOpacity(1)
      setInboxIdleVisible(true)
    }
  }, [phase, clearLocalTimers])

  useEffect(() => {
    if (phase !== 's3_inquiry1') return

    clearLocalTimers()
    setCardsShown([false, false, false, false])
    setStackOpacity(1)
    setInboxIdleVisible(false)

    for (let i = 0; i < 4; i += 1) {
      schedule(() => {
        setCardsShown(prev => {
          const next = [...prev]
          next[i] = true
          return next
        })
      }, i * 1200)
    }

    // Card 4 finishes entering at 3600 + 400ms; hold 2s then fade stack out
    schedule(() => setStackOpacity(0), 6000)

    return clearLocalTimers
  }, [phase, loopId, clearLocalTimers, schedule])

  return (
    <div className={`${HIW_MOCKUP_BOX} transition-opacity duration-500`}>
      <div className="relative w-full h-full min-h-[244px]">
        {/* Idle empty inbox — visible until Step 3 activates */}
        <div
          className="absolute inset-0 z-[1] flex flex-col items-center justify-center transition-opacity duration-300"
          style={{
            opacity: inboxIdleVisible && !step3Active ? 1 : 0,
            pointerEvents: inboxIdleVisible && !step3Active ? 'auto' : 'none',
          }}
        >
          <Inbox size={32} color="#9CA3AF" strokeWidth={1.5} aria-hidden />
          <p className="mt-2 font-sans text-[13px]" style={{ color: '#9CA3AF' }}>
            No inquiries yet.
          </p>
        </div>

        {/* Notification stack */}
        <div
          className="relative w-full h-full min-h-[244px] flex flex-col justify-center transition-opacity duration-500"
          style={{ opacity: stackOpacity }}
        >
          <div className="relative w-full shrink-0" style={{ height: INQUIRY_STACK_HEIGHT }}>
            {INQUIRY_NOTIFICATIONS.map((data, i) => (
              <InquiryCard
                key={data.initials}
                data={data}
                stackIndex={i}
                visible={cardsShown[i]}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Step card shell ──────────────────────────────────────────────────────────

function StepCard({
  num,
  title,
  subtext,
  children,
}: {
  num: string
  title: string
  subtext: string
  children: ReactNode
}) {
  return (
    <div className="relative flex-1 min-w-0">
      <div
        className="relative flex flex-col bg-white rounded-[16px] border border-[#E5E7EB] overflow-hidden shadow-card h-full"
        style={{ minHeight: 440 }}
      >
        <div className="relative flex flex-col h-full" style={{ padding: '20px 20px 0' }}>
          <div className="shrink-0 mb-2">
            <p
              className="font-mono text-orange mb-2"
              style={{ fontSize: 11, letterSpacing: '0.1em' }}
            >
              {num}
            </p>
            <h3
              className="font-sans font-bold text-ink mb-2"
              style={{ fontSize: 16, letterSpacing: '-0.01em' }}
            >
              {title}
            </h3>
            <p className="font-sans text-ink-3 text-sm leading-relaxed">{subtext}</p>
          </div>

          <div className="flex-1 relative min-h-[280px] mb-3 overflow-hidden">{children}</div>
        </div>
      </div>
    </div>
  )
}

// ─── Main section ─────────────────────────────────────────────────────────────

export default function HowItWorksSection() {
  useFlagIconsCss()
  const sectionRef = useRef<HTMLElement>(null)
  const [inView, setInView] = useState(false)
  const [phase, setPhase] = useState<Phase>('idle')
  const [loopId, setLoopId] = useState(0)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.3 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }, [])

  const schedulePhase = useCallback(
    (p: Phase, ms: number) => {
      const id = setTimeout(() => setPhase(p), ms)
      timersRef.current.push(id)
    },
    [],
  )

  const handleListingFadeInStart = useCallback(() => {
    setPhase('c1')
  }, [])

  const handleC1FillComplete = useCallback(() => {
    setPhase('s2_pending')
    schedulePhase('s2_live', HIW_RIPPLE_START_DELAY_MS)
    schedulePhase('c2', HIW_RIPPLE_START_DELAY_MS + STEP2_POST_LIVE_MS)
  }, [schedulePhase])

  const handleC2FillComplete = useCallback(() => {
    setPhase('s3_border')
    schedulePhase('s3_inquiry1', S3_BORDER_TO_INQUIRY_MS)
    schedulePhase('hold', S3_BORDER_TO_INQUIRY_MS + S3_INQUIRY_TO_HOLD_MS)
    const loopRestartMs = S3_BORDER_TO_INQUIRY_MS + S3_INQUIRY_TO_HOLD_MS + HOLD_TO_IDLE_MS
    schedulePhase('idle', loopRestartMs)
    const loopRestartTimer = setTimeout(() => setLoopId(n => n + 1), loopRestartMs)
    timersRef.current.push(loopRestartTimer)
  }, [schedulePhase])

  const startSequence = useCallback(() => {
    clearTimers()
    setPhase('idle')
    S1_TIMELINE.forEach(({ at, phase: p }) => {
      const id = setTimeout(() => setPhase(p), at)
      timersRef.current.push(id)
    })
  }, [clearTimers])

  useEffect(() => {
    if (!inView) {
      clearTimers()
      setPhase('idle')
      return
    }
    startSequence()
    return clearTimers
  }, [inView, loopId, startSequence, clearTimers])

  const c1Filling = phase === 'c1'
  const c1Filled = !['idle', 's1_border', 's1_type', 's1_button', 's1_loading', 's1_listing', 'c1'].includes(phase)

  const c2Filling = phase === 'c2'
  const c2Filled = ['s3_border', 's3_inquiry1', 'hold'].includes(phase)

  return (
    <>
      <style jsx global>{`
        @keyframes hiw-cursor-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes hiw-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.65; }
        }
      `}</style>

      <section ref={sectionRef} className="w-full">
        <div className="page-shell">
          {/* Desktop: horizontal row */}
          <div className="hidden lg:flex items-stretch gap-0">
            <StepCard
              num="01"
              title="Describe Your Equipment"
              subtext="Tell our AI what you have in plain language. It builds a complete listing in seconds."
            >
              <Step1Mockup phase={phase} onListingFadeInStart={handleListingFadeInStart} />
            </StepCard>

            <Connector
              key={`c1-${loopId}`}
              filling={c1Filling}
              filled={c1Filled}
              onFillComplete={handleC1FillComplete}
            />

            <StepCard
              num="02"
              title="Go Live Worldwide"
              subtext="Your listing reaches serious buyers across the globe the moment you hit publish."
            >
              <Step2Mockup phase={phase} loopId={loopId} />
            </StepCard>

            <Connector
              key={`c2-${loopId}`}
              filling={c2Filling}
              filled={c2Filled}
              onFillComplete={handleC2FillComplete}
            />

            <StepCard
              num="03"
              title="Connect and Close"
              subtext="Verified buyers reach you directly through your secure email. No phone number exposure. Just real interest."
            >
              <Step3Mockup phase={phase} loopId={loopId} />
            </StepCard>
          </div>

          {/* Mobile / tablet: vertical stack */}
          <div className="flex lg:hidden flex-col">
            <StepCard
              num="01"
              title="Describe Your Equipment"
              subtext="Tell our AI what you have in plain language. It builds a complete listing in seconds."
            >
              <Step1Mockup phase={phase} onListingFadeInStart={handleListingFadeInStart} />
            </StepCard>

            <Connector
              key={`c1m-${loopId}`}
              vertical
              filling={c1Filling}
              filled={c1Filled}
              onFillComplete={handleC1FillComplete}
            />

            <StepCard
              num="02"
              title="Go Live Worldwide"
              subtext="Your listing reaches serious buyers across the globe the moment you hit publish."
            >
              <Step2Mockup phase={phase} loopId={loopId} />
            </StepCard>

            <Connector
              key={`c2m-${loopId}`}
              vertical
              filling={c2Filling}
              filled={c2Filled}
              onFillComplete={handleC2FillComplete}
            />

            <StepCard
              num="03"
              title="Connect and Close"
              subtext="Verified buyers reach you directly through your secure email. No phone number exposure. Just real interest."
            >
              <Step3Mockup phase={phase} loopId={loopId} />
            </StepCard>
          </div>
        </div>
      </section>
    </>
  )
}
