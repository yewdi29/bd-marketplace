/** Orange sequential scale for geographic choropleth only — not listing tier badges. */
export const ORANGE_SEQUENTIAL = {
  zero: { fill: 'transparent', stroke: '#E5E5E5' },
  50: '#FEF6EC',
  100: '#FCE4C6',
  200: '#F8C88C',
  300: '#F2A555',
  400: '#E8801F',
  500: '#C96412',
  600: '#8F4508',
} as const

export type OrangeScaleStep = 0 | 50 | 100 | 200 | 300 | 400 | 500 | 600

const STEPS: OrangeScaleStep[] = [50, 100, 200, 300, 400, 500, 600]

/**
 * Assigns each non-zero count to a step using quantile bucketing across the
 * current distribution (6 bands between steps 50–600). Zero counts map to step 0.
 */
export function bucketCountsByQuantile(counts: number[]): Map<number, OrangeScaleStep> {
  const nonZero = counts.filter(c => c > 0).sort((a, b) => a - b)
  const result = new Map<number, OrangeScaleStep>()

  if (nonZero.length === 0) {
    for (const c of counts) result.set(c, 0)
    return result
  }

  const thresholds: number[] = []
  for (let i = 1; i <= STEPS.length; i++) {
    const idx = Math.min(
      nonZero.length - 1,
      Math.floor((i / STEPS.length) * nonZero.length) - 1,
    )
    thresholds.push(nonZero[Math.max(0, idx)])
  }

  for (const count of counts) {
    if (count <= 0) {
      result.set(count, 0)
      continue
    }
    let step: OrangeScaleStep = 600
    for (let i = 0; i < thresholds.length; i++) {
      if (count <= thresholds[i]) {
        step = STEPS[i]
        break
      }
    }
    result.set(count, step)
  }

  return result
}

export function fillForStep(step: OrangeScaleStep): string {
  if (step === 0) return ORANGE_SEQUENTIAL.zero.fill
  return ORANGE_SEQUENTIAL[step]
}

export function strokeForStep(step: OrangeScaleStep, highlighted: boolean): string {
  if (highlighted) return ORANGE_SEQUENTIAL[500]
  if (step === 0) return ORANGE_SEQUENTIAL.zero.stroke
  return 'transparent'
}
