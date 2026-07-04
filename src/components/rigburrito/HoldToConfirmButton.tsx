'use client'

import { useCallback, useRef, useState } from 'react'

interface HoldToConfirmButtonProps {
  label: string
  onConfirm: () => void
  disabled?: boolean
}

const HOLD_MS = 2000
const RING_SIZE = 20
const RING_STROKE = 2
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

export default function HoldToConfirmButton({
  label,
  onConfirm,
  disabled = false,
}: HoldToConfirmButtonProps) {
  const [progress, setProgress] = useState(0)
  const [holding, setHolding] = useState(false)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    startRef.current = null
    setHolding(false)
    setProgress(0)
  }, [])

  const tick = useCallback(() => {
    if (!startRef.current) return
    const elapsed = Date.now() - startRef.current
    const pct = Math.min(elapsed / HOLD_MS, 1)
    setProgress(pct)
    if (pct >= 1) {
      stop()
      onConfirm()
      return
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [onConfirm, stop])

  const startHold = () => {
    if (disabled) return
    setHolding(true)
    startRef.current = Date.now()
    rafRef.current = requestAnimationFrame(tick)
  }

  const dashOffset = RING_CIRCUMFERENCE * (1 - progress)

  return (
    <button
      type="button"
      disabled={disabled}
      onMouseDown={startHold}
      onMouseUp={stop}
      onMouseLeave={stop}
      onTouchStart={startHold}
      onTouchEnd={stop}
      className="rigburrito-btn rigburrito-btn-danger rigburrito-hold-btn"
      style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      <svg
        className="rigburrito-hold-ring"
        width={RING_SIZE}
        height={RING_SIZE}
        viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
        aria-hidden
      >
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          fill="none"
          stroke="#FECACA"
          strokeWidth={RING_STROKE}
        />
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          fill="none"
          stroke="#FF6B35"
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
          style={{ transition: holding ? 'none' : 'stroke-dashoffset 0ms' }}
        />
      </svg>
      {holding ? 'Hold to delete...' : label}
    </button>
  )
}
