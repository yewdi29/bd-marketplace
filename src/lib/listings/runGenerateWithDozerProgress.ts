/**
 * Drive dozer loader 0→100% while `/api/listings/generate` runs.
 * Animation targets ~6s (Field+Rise+Top); waits for both API and floor before 100%.
 */

export const DOZER_GENERATE_MIN_MS = 6000
const HOLD_AT_100_MS = 320

type ProgressSetter = (n: number) => void

function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t)
}

/**
 * Runs `work` while reporting progress. Resolves with work’s result after
 * progress reaches 100%. Rejects if work throws (progress stops; caller clears UI).
 */
export async function runGenerateWithDozerProgress<T>(
  work: () => Promise<T>,
  setProgress: ProgressSetter,
): Promise<T> {
  const start = performance.now()
  let raf = 0
  let apiDone = false

  const tick = () => {
    const elapsed = performance.now() - start
    if (!apiDone) {
      const t = Math.min(1, elapsed / DOZER_GENERATE_MIN_MS)
      // Approach 92% over the authored ~6s; creep toward 97% if API is slower.
      let next = easeOutQuad(t) * 92
      if (elapsed > DOZER_GENERATE_MIN_MS) {
        const extra = Math.min(1, (elapsed - DOZER_GENERATE_MIN_MS) / 8000)
        next = 92 + extra * 5
      }
      setProgress(next)
    }
    raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)

  try {
    const result = await work()
    apiDone = true
    cancelAnimationFrame(raf)

    const elapsed = performance.now() - start
    const wait = Math.max(0, DOZER_GENERATE_MIN_MS - elapsed)
    if (wait > 0) {
      // Keep easing toward 92 while we wait out the floor.
      const waitStart = performance.now()
      await new Promise<void>((resolve) => {
        const waitTick = () => {
          const wElapsed = performance.now() - waitStart
          const t = Math.min(1, (elapsed + wElapsed) / DOZER_GENERATE_MIN_MS)
          setProgress(easeOutQuad(t) * 92)
          if (wElapsed >= wait) {
            resolve()
            return
          }
          raf = requestAnimationFrame(waitTick)
        }
        raf = requestAnimationFrame(waitTick)
      })
    }

    setProgress(100)
    await new Promise((r) => setTimeout(r, HOLD_AT_100_MS))
    return result
  } catch (err) {
    cancelAnimationFrame(raf)
    throw err
  } finally {
    cancelAnimationFrame(raf)
  }
}
