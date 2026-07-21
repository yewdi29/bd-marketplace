import type { Phase } from '@/components/home/hiwScrollTypes'

/** Scroll progress (0–1) segment boundaries for mobile scrubbing. */
export const HIW_SCROLL = {
  s1Type: [0.04, 0.18] as const,
  s1Button: [0.18, 0.22] as const,
  s1Loading: [0.22, 0.30] as const,
  s1Listing: [0.30, 0.36] as const,
  c1: [0.36, 0.42] as const,
  s2Pending: [0.42, 0.46] as const,
  s2Live: [0.46, 0.58] as const,
  c2: [0.58, 0.64] as const,
  s3Border: [0.64, 0.68] as const,
  s3Inquiries: [0.68, 0.94] as const,
  hold: [0.94, 1] as const,
} as const

function segmentProgress(t: number, [start, end]: readonly [number, number]): number {
  if (t <= start) return 0
  if (t >= end) return 1
  return (t - start) / (end - start)
}

export function hiwPhaseAtScrollProgress(t: number): Phase {
  const p = Math.max(0, Math.min(1, t))
  if (p < 0.02) return 'idle'
  if (p < HIW_SCROLL.s1Type[0]) return 's1_border'
  if (p < HIW_SCROLL.s1Button[0]) return 's1_type'
  if (p < HIW_SCROLL.s1Loading[0]) return 's1_button'
  if (p < HIW_SCROLL.s1Listing[0]) return 's1_loading'
  if (p < HIW_SCROLL.c1[0]) return 's1_listing'
  if (p < HIW_SCROLL.s2Pending[0]) return 'c1'
  if (p < HIW_SCROLL.s2Live[0]) return 's2_pending'
  if (p < HIW_SCROLL.c2[0]) return 's2_live'
  if (p < HIW_SCROLL.s3Border[0]) return 'c2'
  if (p < HIW_SCROLL.s3Inquiries[0]) return 's3_border'
  if (p < HIW_SCROLL.hold[0]) return 's3_inquiry1'
  return 'hold'
}

export interface HiWMobileScrub {
  phase: Phase
  step1: {
    typedRatio: number
    showProgress: boolean
    progressWidth: number
    buttonPressed: boolean
    showListing: boolean
    fadeForm: boolean
  }
  connectors: {
    c1Fill: number
    c2Fill: number
  }
  step2: {
    showPill: boolean
    isLive: boolean
    isActive: boolean
    rippleProgress: number
  }
  step3: {
    inboxIdleVisible: boolean
    step3Active: boolean
    cardsShown: [boolean, boolean, boolean, boolean]
    stackOpacity: number
  }
}

export function computeMobileHiwScrub(t: number): HiWMobileScrub {
  const p = Math.max(0, Math.min(1, t))
  const phase = hiwPhaseAtScrollProgress(p)

  const typeP = segmentProgress(p, HIW_SCROLL.s1Type)
  const buttonP = segmentProgress(p, HIW_SCROLL.s1Button)
  const loadingP = segmentProgress(p, HIW_SCROLL.s1Loading)
  const listingP = segmentProgress(p, HIW_SCROLL.s1Listing)

  const step1 = {
    typedRatio: typeP,
    showProgress: p >= HIW_SCROLL.s1Loading[0],
    progressWidth: loadingP * 100,
    buttonPressed: buttonP > 0.35 && buttonP < 0.65,
    showListing: listingP > 0.35,
    fadeForm: listingP > 0.05,
  }

  const s2LiveP = segmentProgress(p, HIW_SCROLL.s2Live)
  const pastS2Pending = p >= HIW_SCROLL.s2Pending[0]
  const inS2Live = p >= HIW_SCROLL.s2Live[0]

  const inquiryP = segmentProgress(p, HIW_SCROLL.s3Inquiries)
  const cardThresholds = [0.04, 0.22, 0.42, 0.62] as const

  return {
    phase,
    step1,
    connectors: {
      c1Fill: segmentProgress(p, HIW_SCROLL.c1) * 100,
      c2Fill: segmentProgress(p, HIW_SCROLL.c2) * 100,
    },
    step2: {
      showPill: pastS2Pending,
      isLive: inS2Live && s2LiveP > 0.08,
      isActive: inS2Live,
      rippleProgress: s2LiveP,
    },
    step3: {
      inboxIdleVisible: p < HIW_SCROLL.s3Inquiries[0],
      step3Active: p >= HIW_SCROLL.s3Inquiries[0],
      cardsShown: [
        inquiryP >= cardThresholds[0],
        inquiryP >= cardThresholds[1],
        inquiryP >= cardThresholds[2],
        inquiryP >= cardThresholds[3],
      ],
      stackOpacity: p >= HIW_SCROLL.hold[0] ? Math.max(0, 1 - segmentProgress(p, HIW_SCROLL.hold) * 0.35) : 1,
    },
  }
}
